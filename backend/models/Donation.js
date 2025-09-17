const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donationId: {
    type: String,
    unique: true,
  },
  donor: {
    name: {
      type: String,
      required: [true, 'Donor name is required'],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit mobile number'],
    },
    email: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    address: {
      type: String,
      trim: true,
    },
  },
  type: {
    type: String,
    enum: ['cash', 'upi', 'in-kind'],
    required: [true, 'Donation type is required'],
  },
  amount: {
    type: Number,
    required: function() {
      return this.type === 'cash' || this.type === 'upi';
    },
    min: [0, 'Amount must be positive'],
  },
  upiDetails: {
    transactionId: {
      type: String,
      required: function() {
        return this.type === 'upi';
      },
    },
    upiId: String,
    paymentApp: String,
  },
  items: [{
    itemType: {
      type: String,
      enum: ['rice', 'oil', 'ghee', 'vegetables', 'lentils', 'sugar', 'salt', 'dal', 'wheat', 'flour', 'coconut', 'other'],
      required: function() {
        return this.type === 'in-kind';
      },
    },
    quantity: {
      type: Number,
      required: function() {
        return this.type === 'in-kind';
      },
      min: [0, 'Quantity must be positive'],
    },
    unit: {
      type: String,
      enum: ['kg', 'liters', 'units', 'grams'],
      required: function() {
        return this.type === 'in-kind';
      },
    },
    expiryDate: Date,
    storageInstructions: String,
    description: String,
  }],
  event: {
    type: String,
    enum: ['new-moon', 'full-moon', 'guru-poojai', 'uthira-nakshatram', 'adi-ammavasai', 'anadhanam', 'pradosham', 'shivaratri', 'other', 'general'],
    default: 'general',
  },
  customEvent: String,
  remarks: String,
  receiptGenerated: {
    type: Boolean,
    default: false,
  },
  notificationSent: {
    type: Boolean,
    default: false,
  },
  barcodeGenerated: {
    type: Boolean,
    default: false,
  },
  receivedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['received', 'processed', 'used'],
    default: 'received',
  }
}, {
  timestamps: true,
});

// Generate donation ID before saving
donationSchema.pre('save', async function(next) {
  if (!this.donationId) {
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
    
    this.donationId = `DON${year}${month}${day}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Donation', donationSchema);