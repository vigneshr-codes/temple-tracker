const mongoose = require('mongoose');

const scheduledReportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a schedule name'],
    trim: true,
  },
  reportType: {
    type: String,
    required: [true, 'Please select a report type'],
    enum: [
      'financial-summary',
      'donations',
      'expenses', 
      'balance',
      'inventory',
      'donors'
    ],
  },
  frequency: {
    type: String,
    required: [true, 'Please select frequency'],
    enum: ['daily', 'weekly', 'monthly', 'quarterly'],
    default: 'weekly'
  },
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6,
    default: 1, // Monday
    required: function() {
      return this.frequency === 'weekly';
    }
  },
  dayOfMonth: {
    type: Number,
    min: 1,
    max: 28,
    default: 1,
    required: function() {
      return this.frequency === 'monthly';
    }
  },
  time: {
    type: String,
    required: [true, 'Please select delivery time'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide valid time in HH:MM format'],
    default: '09:00'
  },
  recipients: [{
    type: String,
    required: [true, 'Please add at least one recipient'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add valid email addresses',
    ],
  }],
  format: {
    type: String,
    enum: ['pdf', 'excel', 'csv', 'json'],
    default: 'pdf'
  },
  filters: {
    startDate: { type: Date },
    endDate: { type: Date },
    period: { 
      type: String,
      enum: ['day', 'week', 'month', 'quarter', 'year', 'custom'],
      default: 'month' 
    },
    category: { type: String, default: 'all' },
    type: { type: String, default: 'all' },
    event: { type: String },
    status: { type: String },
    itemType: { type: String },
    minAmount: { type: Number }
  },
  active: {
    type: Boolean,
    default: true
  },
  lastRun: {
    type: Date
  },
  nextRun: {
    type: Date
  },
  runCount: {
    type: Number,
    default: 0
  },
  failureCount: {
    type: Number,
    default: 0
  },
  lastError: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
});

// Calculate next run date based on frequency
scheduledReportSchema.methods.calculateNextRun = function() {
  const now = new Date();
  const nextRun = new Date(now);
  
  // Parse time (HH:MM format)
  const [hours, minutes] = this.time.split(':').map(num => parseInt(num));
  
  switch (this.frequency) {
    case 'daily':
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(hours, minutes, 0, 0);
      break;
      
    case 'weekly':
      const currentDay = nextRun.getDay();
      const targetDay = this.dayOfWeek;
      let daysUntilTarget = (targetDay - currentDay + 7) % 7;
      if (daysUntilTarget === 0) daysUntilTarget = 7; // Next week if today is the target day
      nextRun.setDate(nextRun.getDate() + daysUntilTarget);
      nextRun.setHours(hours, minutes, 0, 0);
      break;
      
    case 'monthly':
      nextRun.setMonth(nextRun.getMonth() + 1);
      nextRun.setDate(this.dayOfMonth);
      nextRun.setHours(hours, minutes, 0, 0);
      break;
      
    case 'quarterly':
      nextRun.setMonth(nextRun.getMonth() + 3);
      nextRun.setDate(1); // First day of quarter
      nextRun.setHours(hours, minutes, 0, 0);
      break;
      
    default:
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(hours, minutes, 0, 0);
  }
  
  return nextRun;
};

// Update next run date before saving
scheduledReportSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('frequency') || this.isModified('dayOfWeek') || 
      this.isModified('dayOfMonth') || this.isModified('time')) {
    this.nextRun = this.calculateNextRun();
  }
  next();
});

// Index for efficient querying
scheduledReportSchema.index({ active: 1, nextRun: 1 });
scheduledReportSchema.index({ createdBy: 1 });
scheduledReportSchema.index({ reportType: 1 });

module.exports = mongoose.model('ScheduledReport', scheduledReportSchema);