const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  inventoryId: {
    type: String,
    unique: true,
  },
  donationId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Donation',
    required: true,
  },
  itemType: {
    type: String,
    enum: ['rice', 'oil', 'ghee', 'vegetables', 'lentils', 'sugar', 'salt', 'dal', 'wheat', 'flour', 'coconut', 'other'],
    required: true,
  },
  description: String,
  quantity: {
    type: Number,
    required: true,
    min: [0, 'Quantity must be positive'],
  },
  unit: {
    type: String,
    enum: ['kg', 'liters', 'units', 'grams'],
    required: true,
  },
  remainingQuantity: {
    type: Number,
    required: true,
    min: [0, 'Remaining quantity cannot be negative'],
  },
  expiryDate: Date,
  storageLocation: {
    type: String,
    default: 'Main Storage',
  },
  storageInstructions: String,
  barcode: {
    data: String,
    image: String, // Base64 encoded barcode image
  },
  status: {
    type: String,
    enum: ['available', 'used', 'expired', 'damaged'],
    default: 'available',
  },
  usageHistory: [{
    date: {
      type: Date,
      required: true,
    },
    quantityUsed: {
      type: Number,
      required: true,
      min: [0, 'Used quantity must be positive'],
    },
    purpose: {
      type: String,
      enum: ['anadhanam', 'daily-prasadam', 'cooking', 'festival', 'puja', 'maintenance', 'distribution', 'special-event', 'other'],
      required: true,
    },
    usedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    remarks: String,
  }],
  donor: {
    name: String,
    mobile: String,
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  }
}, {
  timestamps: true,
});

// Generate inventory ID before saving
inventorySchema.pre('save', async function(next) {
  if (!this.inventoryId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, date.getMonth(), day),
        $lt: new Date(year, date.getMonth(), day + 1)
      }
    });
    
    this.inventoryId = `INV${year}${month}${day}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Update remaining quantity when usage history is modified
inventorySchema.pre('save', function(next) {
  if (this.isModified('usageHistory')) {
    const totalUsed = this.usageHistory.reduce((sum, usage) => sum + usage.quantityUsed, 0);
    this.remainingQuantity = Math.max(0, this.quantity - totalUsed);
    
    // Update status based on remaining quantity
    if (this.remainingQuantity === 0) {
      this.status = 'used';
    } else if (this.expiryDate && new Date() > this.expiryDate) {
      this.status = 'expired';
    } else {
      this.status = 'available';
    }
  }
  next();
});

module.exports = mongoose.model('Inventory', inventorySchema);