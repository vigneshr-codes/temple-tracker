const Fund = require('../models/Fund');
const Donation = require('../models/Donation');
const Expense = require('../models/Expense');

// @desc    Get fund balances
// @route   GET /api/funds
// @access  Private
const getFunds = async (req, res, next) => {
  try {
    const funds = await Fund.find({ isActive: true })
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 });

    // Calculate total balances across all funds
    const totalBalances = funds.reduce((acc, fund) => {
      acc.cash += fund.balance.cash;
      acc.upi += fund.balance.upi;
      acc.total += fund.balance.total;
      return acc;
    }, { cash: 0, upi: 0, total: 0 });

    res.status(200).json({
      success: true,
      data: funds,
      summary: {
        totalFunds: funds.length,
        totalBalances
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single fund with transaction history
// @route   GET /api/funds/:id
// @access  Private
const getFund = async (req, res, next) => {
  try {
    const fund = await Fund.findById(req.params.id)
      .populate('createdBy', 'name username email')
      .populate('transactions.performedBy', 'name username')
      .populate('transactions.sourceId');

    if (!fund) {
      return res.status(404).json({
        success: false,
        message: 'Fund not found'
      });
    }

    res.status(200).json({
      success: true,
      data: fund
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new fund category
// @route   POST /api/funds
// @access  Private (Admin only)
const createFund = async (req, res, next) => {
  try {
    const fundData = {
      ...req.body,
      createdBy: req.user._id
    };

    const fund = await Fund.create(fundData);

    const populatedFund = await Fund.findById(fund._id)
      .populate('createdBy', 'name username');

    res.status(201).json({
      success: true,
      data: populatedFund
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process donation funds
// @route   POST /api/funds/process-donation/:donationId
// @access  Private
const processDonationFunds = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.donationId);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Only process cash and UPI donations
    if (donation.type !== 'cash' && donation.type !== 'upi') {
      return res.status(400).json({
        success: false,
        message: 'Only cash and UPI donations can be processed for funds'
      });
    }

    if (!donation.amount || donation.amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid donation amount'
      });
    }

    const { fundCategory = 'general' } = req.body;

    // Find or create the fund category
    let fund = await Fund.findOne({ category: fundCategory, isActive: true });
    if (!fund) {
      fund = await Fund.create({
        category: fundCategory,
        createdBy: req.user._id,
        description: `${fundCategory.charAt(0).toUpperCase() + fundCategory.slice(1)} fund`
      });
    }

    // Add funds
    await fund.addFunds(
      donation.type, 
      donation.amount, 
      'donation', 
      donation._id, 
      req.user._id,
      `Donation from ${donation.donor.name} - ${donation.donationId}`
    );

    // Update donation status
    donation.status = 'processed';
    await donation.save();

    res.status(200).json({
      success: true,
      message: `₹${donation.amount} added to ${fundCategory} fund from ${donation.type} donation`,
      data: {
        fund: fund,
        donation: donation
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Allocate funds for expense
// @route   POST /api/funds/allocate-expense/:expenseId
// @access  Private (Admin only)
const allocateExpenseFromFunds = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.expenseId);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    if (expense.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Expense already paid'
      });
    }

    const { fundCategory = 'general', paymentMethod = 'cash' } = req.body;

    // Find the fund
    const fund = await Fund.findOne({ category: fundCategory, isActive: true });
    if (!fund) {
      return res.status(404).json({
        success: false,
        message: `${fundCategory} fund not found`
      });
    }

    // Check if sufficient funds available
    const availableAmount = paymentMethod === 'cash' ? fund.balance.cash : fund.balance.upi;
    if (availableAmount < expense.amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${paymentMethod} funds. Available: ₹${availableAmount}, Required: ₹${expense.amount}`
      });
    }

    // Deduct funds
    await fund.deductFunds(
      paymentMethod,
      expense.amount,
      'expense',
      expense._id,
      req.user._id,
      `Payment for expense ${expense.expenseId} - ${expense.description}`
    );

    // Update expense status and add fund allocation details
    expense.status = 'paid';
    expense.fundAllocation = {
      fundId: fund._id,
      fundCategory: fundCategory,
      paymentMethod: paymentMethod,
      allocatedBy: req.user._id,
      allocationDate: new Date()
    };
    await expense.save();

    res.status(200).json({
      success: true,
      message: `₹${expense.amount} allocated from ${fundCategory} fund for expense`,
      data: {
        fund: fund,
        expense: expense
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get fund statistics and reports
// @route   GET /api/funds/reports
// @access  Private
const getFundReports = async (req, res, next) => {
  try {
    const { startDate, endDate, category } = req.query;
    
    // Build filter for date range
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Fund filter
    const fundFilter = { isActive: true };
    if (category) fundFilter.category = category;

    // Get all funds
    const funds = await Fund.find(fundFilter);

    // Calculate donation totals by payment method
    const donationFilter = { type: { $in: ['cash', 'upi'] }, ...dateFilter };
    const donationTotals = await Donation.aggregate([
      { $match: donationFilter },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate expense totals by payment method
    const expenseFilter = { status: 'paid', ...dateFilter };
    const expenseTotals = await Expense.aggregate([
      { $match: expenseFilter },
      {
        $group: {
          _id: '$fundAllocation.paymentMethod',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Current fund balances
    const currentBalances = funds.reduce((acc, fund) => {
      acc[fund.category] = fund.balance;
      return acc;
    }, {});

    // Total balances
    const totalBalances = funds.reduce((acc, fund) => {
      acc.cash += fund.balance.cash;
      acc.upi += fund.balance.upi;
      acc.total += fund.balance.total;
      return acc;
    }, { cash: 0, upi: 0, total: 0 });

    res.status(200).json({
      success: true,
      data: {
        currentBalances,
        totalBalances,
        donationTotals,
        expenseTotals,
        funds: funds.map(fund => ({
          fundId: fund.fundId,
          category: fund.category,
          balance: fund.balance,
          transactionCount: fund.transactions.length,
          lastTransaction: fund.transactions.length > 0 ? 
            fund.transactions[fund.transactions.length - 1].date : null
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Transfer funds between categories
// @route   POST /api/funds/transfer
// @access  Private (Admin only)
const transferFunds = async (req, res, next) => {
  try {
    const { fromCategory, toCategory, amount, method, description } = req.body;

    if (fromCategory === toCategory) {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer to the same fund category'
      });
    }

    // Find source fund
    const sourceFund = await Fund.findOne({ category: fromCategory, isActive: true });
    if (!sourceFund) {
      return res.status(404).json({
        success: false,
        message: `Source fund '${fromCategory}' not found`
      });
    }

    // Find or create destination fund
    let destinationFund = await Fund.findOne({ category: toCategory, isActive: true });
    if (!destinationFund) {
      destinationFund = await Fund.create({
        category: toCategory,
        createdBy: req.user._id,
        description: `${toCategory.charAt(0).toUpperCase() + toCategory.slice(1)} fund`
      });
    }

    // Deduct from source
    await sourceFund.deductFunds(
      method,
      amount,
      'transfer',
      destinationFund._id,
      req.user._id,
      description || `Transfer to ${toCategory} fund`
    );

    // Add to destination
    await destinationFund.addFunds(
      method,
      amount,
      'transfer',
      sourceFund._id,
      req.user._id,
      description || `Transfer from ${fromCategory} fund`
    );

    res.status(200).json({
      success: true,
      message: `₹${amount} transferred from ${fromCategory} to ${toCategory} fund`,
      data: {
        sourceFund,
        destinationFund
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFunds,
  getFund,
  createFund,
  processDonationFunds,
  allocateExpenseFromFunds,
  getFundReports,
  transferFunds
};