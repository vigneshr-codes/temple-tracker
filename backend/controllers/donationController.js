const { validationResult } = require('express-validator');
const Donation = require('../models/Donation');
const Inventory = require('../models/Inventory');
const { generateBarcodeData, createBarcodeLabel } = require('../utils/barcode');
const { sendNotification: sendNotificationUtil, templates } = require('../utils/notification');

// Helper function to normalize item types
const normalizeItemType = (itemType) => {
  if (!itemType) return itemType;
  
  const normalized = itemType.toLowerCase().trim();
  
  // Map common variants to standard enum values
  const mappings = {
    'dal': 'lentils',
    'dhal': 'lentils',
    'daal': 'lentils',
    'lentil': 'lentils',
    'pulses': 'lentils',
    'rava': 'other',
    'semolina': 'other',
    'jaggery': 'sugar',
    'gud': 'sugar',
    'gur': 'sugar',
    'coconut oil': 'oil',
    'groundnut oil': 'oil',
    'sunflower oil': 'oil',
    'sesame oil': 'oil',
    'mustard oil': 'oil',
  };
  
  return mappings[normalized] || normalized;
};

// @desc    Create new donation
// @route   POST /api/donations
// @access  Private
const createDonation = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Normalize case-sensitive fields
    const normalizedBody = { ...req.body };
    
    // Normalize event to lowercase
    if (normalizedBody.event) {
      normalizedBody.event = normalizedBody.event.toLowerCase();
    }
    
    // Normalize itemType to lowercase and map common variants
    if (normalizedBody.items && Array.isArray(normalizedBody.items)) {
      normalizedBody.items = normalizedBody.items.map(item => ({
        ...item,
        itemType: normalizeItemType(item.itemType)
      }));
    }

    const donationData = {
      ...normalizedBody,
      receivedBy: req.user._id
    };

    const donation = await Donation.create(donationData);

    // If it's an in-kind donation, create inventory items
    if (donation.type === 'in-kind' && donation.items && donation.items.length > 0) {
      for (const item of donation.items) {
        const inventoryItem = await Inventory.create({
          donationId: donation._id,
          itemType: item.itemType,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          remainingQuantity: item.quantity,
          expiryDate: item.expiryDate,
          storageInstructions: item.storageInstructions,
          donor: {
            name: donation.donor.name,
            mobile: donation.donor.mobile
          },
          createdBy: req.user._id
        });

        // Generate barcode for the inventory item
        const barcodeData = generateBarcodeData(inventoryItem);
        const barcodeImage = await createBarcodeLabel(inventoryItem);
        
        inventoryItem.barcode = {
          data: JSON.stringify(barcodeData),
          image: barcodeImage
        };
        await inventoryItem.save();
      }
    }

    // Send notification to donor
    try {
      let notificationTemplate;
      if (donation.type === 'cash' || donation.type === 'upi') {
        notificationTemplate = templates.donationConfirmation(
          donation.donor.name,
          donation.amount,
          process.env.TEMPLE_NAME,
          donation.event !== 'general' ? donation.event : null
        );
      } else {
        const itemsList = donation.items.map(item => `${item.quantity} ${item.unit} ${item.itemType}`).join(', ');
        notificationTemplate = {
          subject: `In-kind Donation Receipt - ${process.env.TEMPLE_NAME}`,
          message: `Thank you ${donation.donor.name} for donating ${itemsList} to ${process.env.TEMPLE_NAME}${donation.event !== 'general' ? ` for ${donation.event}` : ''}. Items have been received and barcoded for tracking. Om Namah Shivaya!`
        };
      }

      // Try WhatsApp first, then SMS as fallback
      await sendNotificationUtil('whatsapp', donation.donor.mobile, notificationTemplate.subject, notificationTemplate.message);
      donation.notificationSent = true;
      await donation.save();
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
    }

    const populatedDonation = await Donation.findById(donation._id).populate('receivedBy', 'name username');

    res.status(201).json({
      success: true,
      data: populatedDonation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all donations
// @route   GET /api/donations
// @access  Private
const getDonations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = {};
    if (req.query.type) {
      // Handle comma-separated types like "cash,upi"
      const types = req.query.type.split(',').map(t => t.trim());
      filter.type = { $in: types };
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.event) filter.event = req.query.event;
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.createdAt.$lte = new Date(req.query.endDate);
    }

    const donations = await Donation.find(filter)
      .populate('receivedBy', 'name username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Donation.countDocuments(filter);

    // Calculate total amount for cash and UPI donations
    const totalAmountResult = await Donation.aggregate([
      { $match: { ...filter, type: { $in: ['cash', 'upi'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].total : 0;

    res.status(200).json({
      success: true,
      data: donations,
      pagination: {
        current: page,
        pages: Math.ceil(totalCount / limit),
        total: totalCount
      },
      totalAmount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single donation
// @route   GET /api/donations/:id
// @access  Private
const getDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id).populate('receivedBy', 'name username email');

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: donation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update donation
// @route   PUT /api/donations/:id
// @access  Private (Admin only)
const updateDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    const updatedDonation = await Donation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('receivedBy', 'name username');

    res.status(200).json({
      success: true,
      data: updatedDonation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete donation
// @route   DELETE /api/donations/:id
// @access  Private (Admin only)
const deleteDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    await donation.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Donation deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate receipt for donation
// @route   POST /api/donations/:id/receipt
// @access  Private
const generateReceipt = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id).populate('receivedBy', 'name');

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Update receipt generated flag
    donation.receiptGenerated = true;
    await donation.save();

    // Generate PDF receipt (placeholder - would need PDF generation library)
    const receiptData = {
      donationId: donation.donationId,
      donor: donation.donor,
      type: donation.type,
      amount: donation.amount,
      items: donation.items,
      date: donation.createdAt,
      receivedBy: donation.receivedBy.name,
      templeName: process.env.TEMPLE_NAME,
      templeAddress: process.env.TEMPLE_ADDRESS
    };

    res.status(200).json({
      success: true,
      message: 'Receipt generated successfully',
      data: receiptData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send notification for donation
// @route   POST /api/donations/:id/notification
// @access  Private
const sendDonationNotification = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    let notificationTemplate;
    if (donation.type === 'cash' || donation.type === 'upi') {
      notificationTemplate = templates.donationConfirmation(
        donation.donor.name,
        donation.amount,
        process.env.TEMPLE_NAME,
        donation.event !== 'general' ? donation.event : null
      );
    } else {
      const itemsList = donation.items.map(item => `${item.quantity} ${item.unit} ${item.itemType}`).join(', ');
      notificationTemplate = {
        subject: `In-kind Donation Receipt - ${process.env.TEMPLE_NAME}`,
        message: `Thank you ${donation.donor.name} for donating ${itemsList} to ${process.env.TEMPLE_NAME}. Items received successfully!`
      };
    }

    await sendNotificationUtil('whatsapp', donation.donor.mobile, notificationTemplate.subject, notificationTemplate.message);
    
    donation.notificationSent = true;
    await donation.save();

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDonation,
  getDonations,
  getDonation,
  updateDonation,
  deleteDonation,
  generateReceipt,
  sendDonationNotification
};