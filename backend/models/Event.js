const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['new-moon', 'full-moon', 'guru-poojai', 'uthira-nakshatram', 'adi-ammavasai', 'festival', 'special', 'other'],
    required: true,
  },
  date: {
    type: Date,
    required: [true, 'Event date is required'],
  },
  description: {
    type: String,
    trim: true,
  },
  isRecurring: {
    type: Boolean,
    default: false,
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['monthly', 'yearly', 'lunar-monthly'],
    },
    interval: Number, // e.g., every 2 months
    endDate: Date,
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming',
  },
  organizer: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  budget: {
    allocated: {
      type: Number,
      default: 0,
    },
    spent: {
      type: Number,
      default: 0,
    },
  },
  donations: [{
    donationId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Donation',
    },
    amount: Number,
    type: String,
  }],
  expenses: [{
    expenseId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Expense',
    },
    amount: Number,
  }],
  notifications: {
    reminderSent: {
      type: Boolean,
      default: false,
    },
    thankYouSent: {
      type: Boolean,
      default: false,
    },
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  }
}, {
  timestamps: true,
});

// Virtual field to get linked donations count
eventSchema.virtual('linkedDonationsCount', {
  ref: 'Donation',
  localField: '_id',
  foreignField: 'specificEvent',
  count: true,
});

// Virtual field to get linked expenses count
eventSchema.virtual('linkedExpensesCount', {
  ref: 'Expense',
  localField: '_id',
  foreignField: 'specificEvent',
  count: true,
});

// Calculate total donations and expenses before saving
eventSchema.pre('save', function(next) {
  if (this.isModified('donations')) {
    this.budget.allocated = this.donations.reduce((sum, donation) => {
      return sum + (donation.amount || 0);
    }, 0);
  }
  
  if (this.isModified('expenses')) {
    this.budget.spent = this.expenses.reduce((sum, expense) => {
      return sum + (expense.amount || 0);
    }, 0);
  }
  
  next();
});

// Method to update event status based on date
eventSchema.methods.updateStatusBasedOnDate = function() {
  const now = new Date();
  const eventDate = new Date(this.date);
  
  if (this.status === 'upcoming' && eventDate < now) {
    this.status = 'completed';
  }
  
  return this.status;
};

module.exports = mongoose.model('Event', eventSchema);