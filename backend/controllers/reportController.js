const Donation = require('../models/Donation');
const Expense = require('../models/Expense');
const Inventory = require('../models/Inventory');
const Event = require('../models/Event');

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Today's stats
    const todayDonations = await Donation.aggregate([
      { $match: { createdAt: { $gte: startOfToday } } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          amount: { $sum: { $ifNull: ['$amount', 0] } }
        }
      }
    ]);

    const todayExpenses = await Expense.aggregate([
      { $match: { createdAt: { $gte: startOfToday } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]);

    // Monthly stats
    const monthlyDonations = await Donation.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          amount: { $sum: { $ifNull: ['$amount', 0] } }
        }
      }
    ]);

    const monthlyExpenses = await Expense.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]);

    // Inventory stats
    const inventoryStats = await Inventory.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          remainingQuantity: { $sum: '$remainingQuantity' }
        }
      }
    ]);

    // Expiring items (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const expiringItems = await Inventory.countDocuments({
      status: 'available',
      expiryDate: { $lte: nextWeek, $gte: today }
    });

    // Recent activities (last 10 items)
    const recentDonations = await Donation.find()
      .populate('receivedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentExpenses = await Expense.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Upcoming events
    const upcomingEvents = await Event.find({
      date: { $gte: today },
      status: { $in: ['upcoming', 'ongoing'] }
    })
    .sort({ date: 1 })
    .limit(5);

    // Calculate totals
    const todayTotalDonations = todayDonations.reduce((sum, d) => sum + d.amount, 0);
    const todayTotalExpenses = todayExpenses[0]?.amount || 0;
    const monthlyTotalDonations = monthlyDonations.reduce((sum, d) => sum + d.amount, 0);
    const monthlyTotalExpenses = monthlyExpenses[0]?.amount || 0;

    res.status(200).json({
      success: true,
      data: {
        today: {
          donations: {
            data: todayDonations,
            total: todayTotalDonations,
            count: todayDonations.reduce((sum, d) => sum + d.count, 0)
          },
          expenses: {
            total: todayTotalExpenses,
            count: todayExpenses[0]?.count || 0
          },
          netBalance: todayTotalDonations - todayTotalExpenses
        },
        monthly: {
          donations: {
            data: monthlyDonations,
            total: monthlyTotalDonations,
            count: monthlyDonations.reduce((sum, d) => sum + d.count, 0)
          },
          expenses: {
            total: monthlyTotalExpenses,
            count: monthlyExpenses[0]?.count || 0
          },
          netBalance: monthlyTotalDonations - monthlyTotalExpenses
        },
        inventory: {
          stats: inventoryStats,
          expiringItems,
          total: inventoryStats.reduce((sum, s) => sum + s.count, 0)
        },
        recent: {
          donations: recentDonations,
          expenses: recentExpenses
        },
        upcomingEvents
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get income report
// @route   GET /api/reports/income
// @access  Private
const getIncomeReport = async (req, res, next) => {
  try {
    const { startDate, endDate, event, type } = req.query;

    // Build match criteria
    const matchCriteria = {};
    if (startDate || endDate) {
      matchCriteria.createdAt = {};
      if (startDate) matchCriteria.createdAt.$gte = new Date(startDate);
      if (endDate) matchCriteria.createdAt.$lte = new Date(endDate);
    }
    if (event) matchCriteria.event = event;
    if (type) matchCriteria.type = type;

    // Aggregate donations
    const incomeByType = await Donation.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          amount: { $sum: { $ifNull: ['$amount', 0] } }
        }
      }
    ]);

    const incomeByEvent = await Donation.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$event',
          count: { $sum: 1 },
          amount: { $sum: { $ifNull: ['$amount', 0] } }
        }
      }
    ]);

    const incomeByDate = await Donation.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 },
          amount: { $sum: { $ifNull: ['$amount', 0] } }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Get detailed donations list
    const donations = await Donation.find(matchCriteria)
      .populate('receivedBy', 'name username')
      .sort({ createdAt: -1 })
      .limit(100);

    const totalAmount = incomeByType.reduce((sum, income) => sum + income.amount, 0);
    const totalCount = incomeByType.reduce((sum, income) => sum + income.count, 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalAmount,
          totalCount,
          byType: incomeByType,
          byEvent: incomeByEvent,
          byDate: incomeByDate
        },
        donations
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expense report
// @route   GET /api/reports/expense
// @access  Private
const getExpenseReport = async (req, res, next) => {
  try {
    const { startDate, endDate, category, status } = req.query;

    // Build match criteria
    const matchCriteria = {};
    if (startDate || endDate) {
      matchCriteria.billDate = {};
      if (startDate) matchCriteria.billDate.$gte = new Date(startDate);
      if (endDate) matchCriteria.billDate.$lte = new Date(endDate);
    }
    if (category) matchCriteria.category = category;
    if (status) matchCriteria.status = status;

    // Aggregate expenses
    const expensesByCategory = await Expense.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]);

    const expensesByStatus = await Expense.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]);

    const expensesByDate = await Expense.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$billDate' } }
          },
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Get detailed expenses list
    const expenses = await Expense.find(matchCriteria)
      .populate('createdBy', 'name username')
      .populate('approvedBy', 'name username')
      .sort({ createdAt: -1 })
      .limit(100);

    const totalAmount = expensesByCategory.reduce((sum, expense) => sum + expense.amount, 0);
    const totalCount = expensesByCategory.reduce((sum, expense) => sum + expense.count, 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalAmount,
          totalCount,
          byCategory: expensesByCategory,
          byStatus: expensesByStatus,
          byDate: expensesByDate
        },
        expenses
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get balance sheet
// @route   GET /api/reports/balance
// @access  Private
const getBalanceSheet = async (req, res, next) => {
  try {
    const { startDate, endDate, event } = req.query;

    // Build match criteria
    const matchCriteria = {};
    if (startDate || endDate) {
      matchCriteria.createdAt = {};
      if (startDate) matchCriteria.createdAt.$gte = new Date(startDate);
      if (endDate) matchCriteria.createdAt.$lte = new Date(endDate);
    }
    if (event) matchCriteria.event = event;

    // Get income (donations)
    const income = await Donation.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: null,
          totalCash: {
            $sum: {
              $cond: [{ $eq: ['$type', 'cash'] }, '$amount', 0]
            }
          },
          totalUpi: {
            $sum: {
              $cond: [{ $eq: ['$type', 'upi'] }, '$amount', 0]
            }
          },
          inKindCount: {
            $sum: {
              $cond: [{ $eq: ['$type', 'in-kind'] }, 1, 0]
            }
          },
          totalDonations: { $sum: 1 }
        }
      }
    ]);

    // Get expenses
    const expenseMatchCriteria = { ...matchCriteria };
    if (expenseMatchCriteria.createdAt) {
      expenseMatchCriteria.billDate = expenseMatchCriteria.createdAt;
      delete expenseMatchCriteria.createdAt;
    }

    const expenses = await Expense.aggregate([
      { $match: expenseMatchCriteria },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          approvedExpenses: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0]
            }
          },
          pendingExpenses: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0]
            }
          },
          totalCount: { $sum: 1 }
        }
      }
    ]);

    const incomeData = income[0] || {
      totalCash: 0,
      totalUpi: 0,
      inKindCount: 0,
      totalDonations: 0
    };

    const expenseData = expenses[0] || {
      totalExpenses: 0,
      approvedExpenses: 0,
      pendingExpenses: 0,
      totalCount: 0
    };

    const totalIncome = incomeData.totalCash + incomeData.totalUpi;
    const netBalance = totalIncome - expenseData.approvedExpenses;
    const projectedBalance = totalIncome - expenseData.totalExpenses;

    res.status(200).json({
      success: true,
      data: {
        income: {
          cash: incomeData.totalCash,
          upi: incomeData.totalUpi,
          total: totalIncome,
          inKindItems: incomeData.inKindCount,
          donationCount: incomeData.totalDonations
        },
        expenses: {
          total: expenseData.totalExpenses,
          approved: expenseData.approvedExpenses,
          pending: expenseData.pendingExpenses,
          count: expenseData.totalCount
        },
        balance: {
          current: netBalance,
          projected: projectedBalance,
          cashFlow: totalIncome > expenseData.approvedExpenses ? 'positive' : 'negative'
        },
        period: {
          startDate,
          endDate,
          event
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inventory report
// @route   GET /api/reports/inventory
// @access  Private
const getInventoryReport = async (req, res, next) => {
  try {
    const { itemType, status } = req.query;

    const matchCriteria = {};
    if (itemType) matchCriteria.itemType = itemType;
    if (status) matchCriteria.status = status;

    // Inventory summary
    const inventorySummary = await Inventory.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$itemType',
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          remainingQuantity: { $sum: '$remainingQuantity' },
          usedQuantity: { $sum: { $subtract: ['$quantity', '$remainingQuantity'] } }
        }
      }
    ]);

    // Status-wise breakdown
    const statusBreakdown = await Inventory.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          remainingQuantity: { $sum: '$remainingQuantity' }
        }
      }
    ]);

    // Usage tracking
    const usageStats = await Inventory.aggregate([
      { $match: matchCriteria },
      { $unwind: { path: '$usageHistory', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$usageHistory.purpose',
          totalUsed: { $sum: '$usageHistory.quantityUsed' },
          usageCount: { $sum: 1 }
        }
      }
    ]);

    // Get detailed inventory
    const inventory = await Inventory.find(matchCriteria)
      .populate('donationId', 'donationId donor')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        summary: inventorySummary,
        statusBreakdown,
        usageStats,
        inventory
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get donor report
// @route   GET /api/reports/donors
// @access  Private
const getDonorReport = async (req, res, next) => {
  try {
    const { startDate, endDate, minAmount } = req.query;

    const matchCriteria = {};
    if (startDate || endDate) {
      matchCriteria.createdAt = {};
      if (startDate) matchCriteria.createdAt.$gte = new Date(startDate);
      if (endDate) matchCriteria.createdAt.$lte = new Date(endDate);
    }

    // Donor statistics
    const donorStats = await Donation.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: {
            name: '$donor.name',
            mobile: '$donor.mobile'
          },
          totalDonations: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ['$amount', 0] } },
          cashDonations: {
            $sum: { $cond: [{ $eq: ['$type', 'cash'] }, 1, 0] }
          },
          upiDonations: {
            $sum: { $cond: [{ $eq: ['$type', 'upi'] }, 1, 0] }
          },
          inKindDonations: {
            $sum: { $cond: [{ $eq: ['$type', 'in-kind'] }, 1, 0] }
          },
          lastDonation: { $max: '$createdAt' },
          events: { $addToSet: '$event' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Filter by minimum amount if specified
    const filteredDonors = minAmount 
      ? donorStats.filter(donor => donor.totalAmount >= parseFloat(minAmount))
      : donorStats;

    // Top donors (by amount)
    const topDonors = filteredDonors.slice(0, 10);

    // Frequent donors (by count)
    const frequentDonors = [...filteredDonors]
      .sort((a, b) => b.totalDonations - a.totalDonations)
      .slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        totalDonors: filteredDonors.length,
        topDonors,
        frequentDonors,
        allDonors: filteredDonors
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export report data
// @route   POST /api/reports/export
// @access  Private (Admin only)
const exportReport = async (req, res, next) => {
  try {
    const { reportType, format, filters } = req.body;

    // This would generate export files (CSV, PDF, Excel)
    // For now, return the data structure
    let data;

    switch (reportType) {
      case 'income':
        // Call getIncomeReport logic
        break;
      case 'expense':
        // Call getExpenseReport logic
        break;
      case 'balance':
        // Call getBalanceSheet logic
        break;
      case 'inventory':
        // Call getInventoryReport logic
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    res.status(200).json({
      success: true,
      message: `${reportType} report export initiated`,
      format,
      filters
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getIncomeReport,
  getExpenseReport,
  getBalanceSheet,
  getInventoryReport,
  getDonorReport,
  exportReport
};