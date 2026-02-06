const mongoose = require('mongoose');

const fundSchema = new mongoose.Schema({
  fundId: {
    type: String,
    unique: true,
  },
  // Fund Categories
  category: {
    type: String,
    enum: ['general', 'maintenance', 'festival', 'anadhanam', 'construction', 'emergency'],
    default: 'general',
  },
  // Fund Balance
  balance: {
    cash: {
      type: Number,
      default: 0,
      min: [0, 'Cash balance cannot be negative'],
    },
    upi: {
      type: Number,
      default: 0,
      min: [0, 'UPI balance cannot be negative'],
    },
    total: {
      type: Number,
      default: 0,
      min: [0, 'Total balance cannot be negative'],
    }
  },
  // Transaction History
  transactions: [{
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },
    source: {
      type: String,
      enum: ['donation', 'expense', 'transfer', 'adjustment'],
      required: true,
    },
    sourceId: {
      type: mongoose.Schema.ObjectId,
      refPath: 'transactions.sourceType',
    },
    sourceType: {
      type: String,
      enum: ['Donation', 'Expense', 'Fund'],
    },
    method: {
      type: String,
      enum: ['cash', 'upi'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      cash: Number,
      upi: Number,
      total: Number,
    },
    description: String,
    performedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    }
  }],
  // Fund Management
  isActive: {
    type: Boolean,
    default: true,
  },
  description: String,
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

// Generate fund ID before saving
fundSchema.pre('save', async function(next) {
  if (!this.fundId) {
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
    
    this.fundId = `FND${year}${month}${day}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Update total balance when cash or UPI balance changes
fundSchema.pre('save', function(next) {
  this.balance.total = this.balance.cash + this.balance.upi;
  this.lastUpdated = new Date();
  next();
});

// Method to add funds
fundSchema.methods.addFunds = function(method, amount, source, sourceId, performedBy, description) {
  const transaction = {
    type: 'credit',
    source: source,
    sourceId: sourceId,
    sourceType: source === 'donation' ? 'Donation' : source === 'expense' ? 'Expense' : 'Fund',
    method: method,
    amount: amount,
    description: description,
    performedBy: performedBy,
    date: new Date()
  };

  // Update balance
  if (method === 'cash') {
    this.balance.cash += amount;
  } else if (method === 'upi') {
    this.balance.upi += amount;
  }

  // Record balance after transaction
  transaction.balanceAfter = {
    cash: this.balance.cash,
    upi: this.balance.upi,
    total: this.balance.cash + this.balance.upi
  };

  this.transactions.push(transaction);
  return this.save();
};

// Method to deduct funds
fundSchema.methods.deductFunds = function(method, amount, source, sourceId, performedBy, description) {
  // Check if sufficient funds available
  const availableAmount = method === 'cash' ? this.balance.cash : this.balance.upi;
  if (availableAmount < amount) {
    throw new Error(`Insufficient ${method} funds. Available: ₹${availableAmount}, Required: ₹${amount}`);
  }

  const transaction = {
    type: 'debit',
    source: source,
    sourceId: sourceId,
    sourceType: source === 'donation' ? 'Donation' : source === 'expense' ? 'Expense' : 'Fund',
    method: method,
    amount: amount,
    description: description,
    performedBy: performedBy,
    date: new Date()
  };

  // Update balance
  if (method === 'cash') {
    this.balance.cash -= amount;
  } else if (method === 'upi') {
    this.balance.upi -= amount;
  }

  // Record balance after transaction
  transaction.balanceAfter = {
    cash: this.balance.cash,
    upi: this.balance.upi,
    total: this.balance.cash + this.balance.upi
  };

  this.transactions.push(transaction);
  return this.save();
};

module.exports = mongoose.model('Fund', fundSchema);