const { validationResult } = require('express-validator');
const Event = require('../models/Event');
const Donation = require('../models/Donation');
const Expense = require('../models/Expense');

// @desc    Create new event
// @route   POST /api/events
// @access  Private
const createEvent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const eventData = {
      ...req.body,
      organizer: req.user._id,
      createdBy: req.user._id
    };

    const event = await Event.create(eventData);

    const populatedEvent = await Event.findById(event._id)
      .populate('organizer', 'name username')
      .populate('createdBy', 'name username');

    res.status(201).json({
      success: true,
      data: populatedEvent
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all events
// @route   GET /api/events
// @access  Private
const getEvents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    }

    const events = await Event.find(filter)
      .populate('organizer', 'name username')
      .populate('createdBy', 'name username')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Event.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: events,
      pagination: {
        current: page,
        pages: Math.ceil(totalCount / limit),
        total: totalCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Private
const getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name username email')
      .populate('createdBy', 'name username')
      .populate('donations.donationId', 'donationId donor amount type')
      .populate('expenses.expenseId', 'expenseId description amount category');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Get related donations and expenses
    const donations = await Donation.find({
      $or: [
        { event: event.type },
        { customEvent: event.name }
      ]
    }).populate('receivedBy', 'name username');

    const expenses = await Expense.find({
      $or: [
        { event: event.type },
        { customEvent: event.name }
      ]
    }).populate('createdBy', 'name username');

    res.status(200).json({
      success: true,
      data: {
        ...event.toObject(),
        relatedDonations: donations,
        relatedExpenses: expenses
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Admin only)
const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('organizer', 'name username')
    .populate('createdBy', 'name username');

    res.status(200).json({
      success: true,
      data: updatedEvent
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Admin only)
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if event has associated donations or expenses
    const donationCount = await Donation.countDocuments({
      $or: [
        { event: event.type },
        { customEvent: event.name }
      ]
    });

    const expenseCount = await Expense.countDocuments({
      $or: [
        { event: event.type },
        { customEvent: event.name }
      ]
    });

    if (donationCount > 0 || expenseCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete event with associated donations or expenses'
      });
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get event donations
// @route   GET /api/events/:id/donations
// @access  Private
const getEventDonations = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const donations = await Donation.find({
      $or: [
        { event: event.type },
        { customEvent: event.name }
      ]
    })
    .populate('receivedBy', 'name username')
    .sort({ createdAt: -1 });

    // Calculate totals
    const cashDonations = donations.filter(d => d.type === 'cash');
    const upiDonations = donations.filter(d => d.type === 'upi');
    const inKindDonations = donations.filter(d => d.type === 'in-kind');

    const totalCash = cashDonations.reduce((sum, d) => sum + d.amount, 0);
    const totalUpi = upiDonations.reduce((sum, d) => sum + d.amount, 0);
    const totalMonetary = totalCash + totalUpi;

    res.status(200).json({
      success: true,
      data: donations,
      summary: {
        total: donations.length,
        cash: cashDonations.length,
        upi: upiDonations.length,
        inKind: inKindDonations.length,
        totalCash,
        totalUpi,
        totalMonetary
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get event expenses
// @route   GET /api/events/:id/expenses
// @access  Private
const getEventExpenses = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const expenses = await Expense.find({
      $or: [
        { event: event.type },
        { customEvent: event.name }
      ]
    })
    .populate('createdBy', 'name username')
    .populate('approvedBy', 'name username')
    .sort({ createdAt: -1 });

    // Calculate totals by category and status
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const approvedAmount = expenses
      .filter(e => e.status === 'approved')
      .reduce((sum, e) => sum + e.amount, 0);
    const pendingAmount = expenses
      .filter(e => e.status === 'pending')
      .reduce((sum, e) => sum + e.amount, 0);

    // Group by category
    const byCategory = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = {
          count: 0,
          amount: 0
        };
      }
      acc[expense.category].count += 1;
      acc[expense.category].amount += expense.amount;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: expenses,
      summary: {
        total: expenses.length,
        totalAmount,
        approvedAmount,
        pendingAmount,
        byCategory
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  getEventDonations,
  getEventExpenses
};