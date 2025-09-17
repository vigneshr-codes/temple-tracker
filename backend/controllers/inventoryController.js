const { validationResult } = require('express-validator');
const Inventory = require('../models/Inventory');
const { generateBarcodeData, createBarcodeLabel, decodeBarcodeData } = require('../utils/barcode');
const { sendNotification: sendNotificationUtil, templates } = require('../utils/notification');

// Helper function to normalize purpose values
const normalizePurpose = (purpose) => {
  if (!purpose) return purpose;
  
  const normalized = purpose.toLowerCase().trim().replace(/\s+/g, '-');
  
  // Map common variants to standard enum values
  const mappings = {
    'daily-prasadam': 'daily-prasadam',
    'prasadam': 'daily-prasadam',
    'daily-food': 'daily-prasadam',
    'temple-cooking': 'cooking',
    'kitchen': 'cooking',
    'food-preparation': 'cooking',
    'special-puja': 'puja',
    'temple-puja': 'puja',
    'worship': 'puja',
    'festival-celebration': 'festival',
    'festival-food': 'festival',
    'celebration': 'festival',
    'temple-maintenance': 'maintenance',
    'cleaning': 'maintenance',
    'repair': 'maintenance',
    'donation-distribution': 'distribution',
    'charity': 'distribution',
    'give-away': 'distribution',
  };
  
  return mappings[normalized] || normalized;
};

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private
const getInventory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = {};
    if (req.query.itemType) filter.itemType = req.query.itemType;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.storageLocation) filter.storageLocation = req.query.storageLocation;

    const inventory = await Inventory.find(filter)
      .populate('donationId', 'donationId donor')
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Inventory.countDocuments(filter);

    // Get summary statistics
    const stats = await Inventory.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          remainingQuantity: { $sum: '$remainingQuantity' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: inventory,
      pagination: {
        current: page,
        pages: Math.ceil(totalCount / limit),
        total: totalCount
      },
      stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single inventory item
// @route   GET /api/inventory/:id
// @access  Private
const getInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.findById(req.params.id)
      .populate('donationId', 'donationId donor event')
      .populate('createdBy', 'name username')
      .populate('usageHistory.usedBy', 'name username');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private (Admin only)
const updateInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    const updatedItem = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedItem
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Use inventory item
// @route   POST /api/inventory/:id/use
// @access  Private
const useInventoryItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { quantityUsed, remarks } = req.body;
    const purpose = normalizePurpose(req.body.purpose);

    const item = await Inventory.findById(req.params.id).populate('donationId', 'donor');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    if (item.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Item is not available for use'
      });
    }

    if (quantityUsed > item.remainingQuantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient quantity available'
      });
    }

    // Add usage record
    item.usageHistory.push({
      date: new Date(),
      quantityUsed,
      purpose,
      usedBy: req.user._id,
      remarks
    });

    // Save will trigger pre-save hook to update remaining quantity and status
    await item.save();

    // Send notification to donor about item usage
    try {
      if (item.donor && item.donor.mobile) {
        const notificationTemplate = templates.itemUsageNotification(
          item.donor.name,
          item.itemType,
          `${quantityUsed} ${item.unit}`,
          purpose,
          process.env.TEMPLE_NAME
        );

        await sendNotificationUtil('whatsapp', item.donor.mobile, notificationTemplate.subject, notificationTemplate.message);
      }
    } catch (notificationError) {
      console.error('Failed to send usage notification:', notificationError);
    }

    const updatedItem = await Inventory.findById(item._id)
      .populate('donationId', 'donationId donor event')
      .populate('usageHistory.usedBy', 'name username');

    res.status(200).json({
      success: true,
      message: 'Item usage recorded successfully',
      data: updatedItem
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate barcode for inventory item
// @route   POST /api/inventory/:id/barcode
// @access  Private
const generateBarcode = async (req, res, next) => {
  try {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    const barcodeData = generateBarcodeData(item);
    const barcodeLabel = await createBarcodeLabel(item);

    // Update item with barcode data
    item.barcode = {
      data: JSON.stringify(barcodeData),
      image: barcodeLabel
    };
    await item.save();

    res.status(200).json({
      success: true,
      message: 'Barcode generated successfully',
      data: {
        barcodeData,
        barcodeLabel
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Scan barcode and get item details
// @route   GET /api/inventory/scan/:barcode
// @access  Private
const scanBarcode = async (req, res, next) => {
  try {
    const scannedData = req.params.barcode;
    console.log('Received scanned data:', scannedData);

    // Decode barcode data
    let barcodeData;
    try {
      barcodeData = decodeBarcodeData(scannedData);
      console.log('Decoded barcode data:', barcodeData);
    } catch (decodeError) {
      console.log('Barcode decode error:', decodeError.message);
      return res.status(400).json({
        success: false,
        message: 'Invalid barcode format - not valid JSON data'
      });
    }

    // Validate that required fields exist
    if (!barcodeData.inventoryId) {
      console.log('Missing inventoryId in scanned data');
      return res.status(400).json({
        success: false,
        message: 'Invalid barcode - missing inventory ID'
      });
    }

    // Find inventory item by ID
    const item = await Inventory.findOne({ inventoryId: barcodeData.inventoryId })
      .populate('donationId', 'donationId donor event')
      .populate('createdBy', 'name username');

    console.log('Found inventory item:', item ? 'Yes' : 'No');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `Inventory item with ID ${barcodeData.inventoryId} not found`
      });
    }

    res.status(200).json({
      success: true,
      data: item,
      scannedData: barcodeData
    });
  } catch (error) {
    console.error('Scan endpoint error:', error);
    next(error);
  }
};

// @desc    Get items expiring soon
// @route   GET /api/inventory/expiring
// @access  Private
const getExpiringItems = async (req, res, next) => {
  try {
    const daysAhead = parseInt(req.query.days) || 7; // Default 7 days
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysAhead);

    const expiringItems = await Inventory.find({
      status: 'available',
      expiryDate: {
        $exists: true,
        $lte: expiryDate,
        $gte: new Date() // Not already expired
      }
    })
    .populate('donationId', 'donationId donor')
    .sort({ expiryDate: 1 });

    // Group by urgency
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const grouped = {
      critical: expiringItems.filter(item => item.expiryDate <= tomorrow),
      urgent: expiringItems.filter(item => item.expiryDate > tomorrow && item.expiryDate <= nextWeek),
      warning: expiringItems.filter(item => item.expiryDate > nextWeek)
    };

    res.status(200).json({
      success: true,
      data: expiringItems,
      grouped,
      summary: {
        critical: grouped.critical.length,
        urgent: grouped.urgent.length,
        warning: grouped.warning.length,
        total: expiringItems.length
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory,
  getInventoryItem,
  updateInventoryItem,
  useInventoryItem,
  generateBarcode,
  scanBarcode,
  getExpiringItems
};