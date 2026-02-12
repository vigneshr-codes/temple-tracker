const { validationResult } = require('express-validator');
const Donation = require('../models/Donation');
const Inventory = require('../models/Inventory');
const Settings = require('../models/Settings');
const { generateBarcodeData, createBarcodeLabel } = require('../utils/barcode');
const { sendNotification, templates } = require('../utils/notification');

// Fetch temple name from DB settings, fallback to env
const getTempleName = async () => {
  try {
    const settings = await Settings.findOne().select('templeConfig.name');
    return settings?.templeConfig?.name || process.env.TEMPLE_NAME || 'Temple';
  } catch {
    return process.env.TEMPLE_NAME || 'Temple';
  }
};

// Resolve effective expiry date based on source mode
const resolveExpiryDate = (item, donationDate) => {
  const addDuration = (baseDate, value, unit) => {
    const d = new Date(baseDate);
    if (unit === 'days')   d.setDate(d.getDate() + value);
    if (unit === 'months') d.setMonth(d.getMonth() + value);
    if (unit === 'years')  d.setFullYear(d.getFullYear() + value);
    return d;
  };

  if (item.expiryDateSource === 'calculated-from-mfg' && item.manufactureDate && item.shelfLifeValue) {
    return addDuration(item.manufactureDate, item.shelfLifeValue, item.shelfLifeUnit || 'months');
  }
  if (item.expiryDateSource === 'calculated-from-donation' && item.shelfLifeValue) {
    return addDuration(donationDate || new Date(), item.shelfLifeValue, item.shelfLifeUnit || 'months');
  }
  return item.expiryDate || null;
};

// Helper function to normalize item types
const normalizeItemType = (itemType) => {
  if (!itemType) return itemType;
  
  const normalized = itemType.toLowerCase().trim();
  
  const mappings = {
    // Lentils / Dal
    'dal': 'lentils',
    'dhal': 'lentils',
    'daal': 'lentils',
    'lentil': 'lentils',
    'pulses': 'lentils',

    // Sugar / Jaggery
    'jaggery': 'jaggery',
    'gud': 'jaggery',
    'gur': 'jaggery',
    'vellam': 'jaggery',

    // Oil variants
    'coconut oil': 'oil',
    'groundnut oil': 'oil',
    'sunflower oil': 'oil',
    'sesame oil': 'oil',
    'mustard oil': 'oil',
    'gingelly oil': 'oil',
    'nallennai': 'oil',

    // Dairy
    'whole milk': 'milk',
    'cow milk': 'milk',
    'buffalo milk': 'milk',
    'paasumpal': 'milk',
    'milk powder': 'milk powder',
    'skimmed milk powder': 'milk powder',
    'full cream milk powder': 'milk powder',
    'curd': 'curd',
    'yogurt': 'curd',
    'yoghurt': 'curd',
    'thayir': 'curd',
    'buttermilk': 'buttermilk',
    'moru': 'buttermilk',
    'butter': 'butter',
    'vennai': 'butter',
    'white butter': 'butter',
    'ghee': 'ghee',
    'nei': 'ghee',
    'cow ghee': 'ghee',
    'paneer': 'paneer',
    'cottage cheese': 'paneer',

    // Grains / Flour
    'rava': 'semolina',
    'semolina': 'semolina',
    'sooji': 'semolina',
    'maida': 'flour',
    'wheat flour': 'flour',
    'rice flour': 'rice flour',
    'idli rice': 'rice',
    'ponni rice': 'rice',
    'basmati': 'rice',
    'basmati rice': 'rice',
    'broken rice': 'rice',

    // Coconut
    'coconut': 'coconut',
    'dry coconut': 'coconut',
    'thengai': 'coconut',

    // Vegetables / Fruits
    'banana': 'fruits',
    'plantain': 'fruits',
    'mango': 'fruits',
    'apple': 'fruits',
    'orange': 'fruits',
    'tomato': 'vegetables',
    'onion': 'vegetables',
    'potato': 'vegetables',

    // Other temple items
    'camphor': 'camphor',
    'incense': 'incense',
    'flowers': 'flowers',
    'flower': 'flowers',
    'poo': 'flowers',
    'agarbatti': 'incense',
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

    // Handle event linking logic
    let eventLinkStatus = 'general';
    if (normalizedBody.specificEvent) {
      const Event = require('../models/Event');
      const event = await Event.findById(normalizedBody.specificEvent);
      
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
        delete normalizedBody.specificEvent;
      }
    }

    const donationData = {
      ...normalizedBody,
      receivedBy: req.user._id,
      eventLinkStatus
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
          expiryDate: resolveExpiryDate(item, donation.createdAt),
          expiryDateSource: item.expiryDateSource || 'manual',
          manufactureDate: item.manufactureDate || null,
          shelfLifeValue: item.shelfLifeValue || null,
          shelfLifeUnit: item.shelfLifeUnit || 'months',
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

    // Send notification to donor (fire and forget — logged internally)
    sendNotification('donation', {
      donor: donation.donor,
      type: donation.type,
      amount: donation.amount,
      items: donation.items,
      event: donation.event,
      receiptId: donation.donationId,
      referenceId: donation._id,
      referenceType: 'Donation'
    }, req.user).then(() => {
      // Mark notificationSent flag after async send
      Donation.findByIdAndUpdate(donation._id, { notificationSent: true }).catch(() => {});
    }).catch(() => {});

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
      .select('-donor.aadhaarNumber')   // Aadhaar excluded from list — only admins see it on single record
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

    // Count donations per type across the full filtered collection
    const typeCountsResult = await Donation.aggregate([
      { $match: filter },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    const typeCounts = typeCountsResult.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: donations,
      pagination: {
        current: page,
        pages: Math.ceil(totalCount / limit),
        total: totalCount
      },
      totalAmount,
      typeCounts
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

    const { donor, type, amount, items, notes, event, isAnonymous, isCorpusDonation,
            chequeDetails, upiDetails, neftDetails, rtgsDetails } = req.body;
    const allowedUpdate = { donor, type, amount, items, notes, event, isAnonymous, isCorpusDonation,
                            chequeDetails, upiDetails, neftDetails, rtgsDetails };
    // Remove undefined keys so existing values aren't overwritten with undefined
    Object.keys(allowedUpdate).forEach(k => allowedUpdate[k] === undefined && delete allowedUpdate[k]);

    const updatedDonation = await Donation.findByIdAndUpdate(
      req.params.id,
      allowedUpdate,
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
    const settings = await Settings.findOne().select('templeConfig');
    const receiptData = {
      donationId: donation.donationId,
      donor: donation.donor,
      type: donation.type,
      amount: donation.amount,
      items: donation.items,
      date: donation.createdAt,
      receivedBy: donation.receivedBy.name,
      templeName: settings?.templeConfig?.name || process.env.TEMPLE_NAME,
      templeAddress: settings?.templeConfig?.address || process.env.TEMPLE_ADDRESS
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

    await sendNotification('donation', {
      donor: donation.donor,
      type: donation.type,
      amount: donation.amount,
      items: donation.items,
      event: donation.event,
      receiptId: donation.donationId,
      referenceId: donation._id,
      referenceType: 'Donation'
    }, req.user);

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