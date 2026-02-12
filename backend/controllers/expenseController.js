const { validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Inventory = require('../models/Inventory');

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Handle event linking logic
    let eventLinkStatus = 'general';
    const expenseBody = { ...req.body };
    
    if (expenseBody.specificEvent) {
      const Event = require('../models/Event');
      const event = await Event.findById(expenseBody.specificEvent);
      
      if (event) {
        // Determine link status based on event status and date
        const now = new Date();
        if (event.date < now && event.status === 'completed') {
          eventLinkStatus = 'linked-completed';
        } else if (event.status === 'cancelled') {
          eventLinkStatus = 'linked-cancelled';
        } else {
          eventLinkStatus = 'linked-active';
        }
      } else {
        // Invalid event ID, remove the link
        delete expenseBody.specificEvent;
      }
    }

    const expenseData = {
      ...expenseBody,
      createdBy: req.user._id,
      eventLinkStatus
    };

    const expense = new Expense(expenseData);
    await expense.save();

    const populatedExpense = await Expense.findById(expense._id)
      .populate('createdBy', 'name username')
      .populate('linkedInventory.inventoryId', 'inventoryId itemType');

    res.status(201).json({
      success: true,
      data: populatedExpense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.event) filter.event = req.query.event;
    if (req.query.startDate || req.query.endDate) {
      filter.billDate = {};
      if (req.query.startDate) filter.billDate.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.billDate.$lte = new Date(req.query.endDate);
    }

    const expenses = await Expense.find(filter)
      .populate('createdBy', 'name username')
      .populate('approvedBy', 'name username')
      .populate('linkedInventory.inventoryId', 'inventoryId itemType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Expense.countDocuments(filter);

    // Calculate totals by status
    const totals = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalAmount = await Expense.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      success: true,
      data: expenses,
      pagination: {
        current: page,
        pages: Math.ceil(totalCount / limit),
        total: totalCount
      },
      totals,
      totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
const getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('createdBy', 'name username email')
      .populate('approvedBy', 'name username email')
      .populate('linkedInventory.inventoryId', 'inventoryId itemType donor');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Only allow creator or admin to update
    if (expense.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this expense'
      });
    }

    // Don't allow updates to approved expenses unless admin
    if (expense.status === 'approved' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot update approved expense'
      });
    }

    const { category, amount, description, vendor, billDate, paymentMethod,
            notes, linkedInventory, receiptNumber } = req.body;
    const allowedUpdate = { category, amount, description, vendor, billDate, paymentMethod,
                            notes, linkedInventory, receiptNumber };
    Object.keys(allowedUpdate).forEach(k => allowedUpdate[k] === undefined && delete allowedUpdate[k]);

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      allowedUpdate,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'name username')
    .populate('approvedBy', 'name username')
    .populate('linkedInventory.inventoryId', 'inventoryId itemType');

    res.status(200).json({
      success: true,
      data: updatedExpense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private (Admin only)
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Don't allow deletion of approved expenses
    if (expense.status === 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete approved expense'
      });
    }

    await expense.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve expense
// @route   PUT /api/expenses/:id/approve
// @access  Private (Admin only)
const approveExpense = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either approved or rejected'
      });
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    if (expense.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending expenses can be approved or rejected'
      });
    }

    expense.status = status;
    expense.approvedBy = req.user._id;
    expense.approvalDate = new Date();
    if (remarks) expense.remarks = remarks;

    await expense.save();

    const updatedExpense = await Expense.findById(expense._id)
      .populate('createdBy', 'name username')
      .populate('approvedBy', 'name username');

    res.status(200).json({
      success: true,
      message: `Expense ${status} successfully`,
      data: updatedExpense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate challan for expense
// @route   GET /api/expenses/:id/challan
// @access  Private
const generateChallan = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('createdBy', 'name username email')
      .populate('approvedBy', 'name username email')
      .populate('linkedInventory.inventoryId', 'inventoryId itemType quantity unit donor');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Generate challan number
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const challanNumber = `CH${expense.expenseId}${year}${month}${day}`;

    const challanData = {
      challanNumber,
      expense,
      generatedDate: new Date(),
      linkedItems: expense.linkedInventory || [],
      totalAmount: expense.amount,
      event: expense.event,
      customEvent: expense.customEvent
    };

    res.status(200).json({
      success: true,
      data: challanData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available inventory items for linking
// @route   GET /api/expenses/inventory/available
// @access  Private
const getAvailableInventory = async (req, res, next) => {
  try {
    const inventory = await Inventory.find({ 
      status: 'available',
      remainingQuantity: { $gt: 0 }
    })
    .select('inventoryId itemType description quantity remainingQuantity unit donor')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: inventory
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
  approveExpense,
  generateChallan,
  getAvailableInventory
};