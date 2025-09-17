const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  expenseId: {
    type: String,
    unique: true,
  },
  category: {
    type: String,
    enum: ['cooking-gas-fuel', 'labor-charges', 'electricity-bill', 'maintenance', 'other-temple-expenses', 'water-bill', 'festival-expenses', 'anadhanam-supplies', 'cleaning-supplies', 'other'],
    required: [true, 'Expense category is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  vendor: {
    name: {
      type: String,
      required: [true, 'Vendor name is required'],
      trim: true,
    },
    contact: String,
    address: String,
  },
  invoiceNumber: String,
  billDate: {
    type: Date,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'bank-transfer', 'cheque'],
    required: true,
  },
  paymentDetails: {
    transactionId: String,
    chequeNumber: String,
    bankDetails: String,
  },
  event: {
    type: String,
    enum: ['new-moon-day', 'full-moon-day', 'guru-poojai', 'uthira-nakshatram', 'adi-ammavasai', 'custom', 'general'],
    default: 'general',
  },
  customEvent: String,
  linkedInventory: [{
    inventoryId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Inventory',
    },
    description: String,
  }],
  receiptAttachment: String, // File path or URL
  status: {
    type: String,
    enum: ['pending', 'paid', 'approved', 'rejected'],
    default: 'pending',
  },
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  approvalDate: Date,
  recurringExpense: {
    isRecurring: {
      type: Boolean,
      default: false,
    },
    frequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
    },
    nextDue: Date,
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  fundAllocation: {
    fundId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Fund',
    },
    fundCategory: {
      type: String,
      enum: ['general', 'maintenance', 'festival', 'anadhanam', 'construction', 'emergency'],
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi'],
    },
    allocatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    allocationDate: Date,
  },
  remarks: String,
}, {
  timestamps: true,
});

// Generate expense ID before saving
expenseSchema.pre('save', async function(next) {
  if (!this.expenseId) {
    try {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      // Count existing expenses for today
      const count = await this.constructor.countDocuments({
        createdAt: {
          $gte: new Date(year, date.getMonth(), date.getDate()),
          $lt: new Date(year, date.getMonth(), date.getDate() + 1)
        }
      });
      
      this.expenseId = `EXP${year}${month}${day}${String(count + 1).padStart(4, '0')}`;
      console.log('Generated expense ID:', this.expenseId);
    } catch (error) {
      console.error('Error generating expense ID:', error);
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Expense', expenseSchema);