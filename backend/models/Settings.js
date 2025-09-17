const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Temple Configuration
  templeConfig: {
    name: {
      type: String,
      required: true,
      default: 'Temple Management System'
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    },
    contact: {
      phone: String,
      email: String,
      website: String
    },
    logo: String, // File path or URL
    registrationNumber: String,
    establishedYear: Number
  },

  // Notification Settings
  notifications: {
    enableWhatsApp: { type: Boolean, default: false },
    enableSMS: { type: Boolean, default: false },
    enableEmail: { type: Boolean, default: false },
    whatsAppConfig: {
      apiKey: String,
      phoneNumberId: String,
      businessAccountId: String
    },
    smsConfig: {
      provider: { type: String, enum: ['twilio', 'msg91', 'textlocal'], default: 'twilio' },
      apiKey: String,
      senderId: String
    },
    emailConfig: {
      host: String,
      port: Number,
      username: String,
      password: String,
      fromEmail: String,
      fromName: String
    },
    templates: {
      donationThankYou: {
        whatsapp: { type: String, default: 'Thank you {donorName} for your ₹{amount} donation to {templeName} for {event}. Your contribution supports our temple activities.' },
        sms: { type: String, default: 'Thank you {donorName} for your ₹{amount} donation to {templeName}. Receipt: {receiptId}' },
        email: { type: String, default: 'Dear {donorName}, Thank you for your generous donation of ₹{amount}.' }
      },
      inventoryUsage: {
        whatsapp: { type: String, default: 'Dear {donorName}, your donated {itemType} of {quantity} was used today for {purpose} in {templeName}. Thank you!' },
        sms: { type: String, default: 'Your donated {itemType} was used for {purpose} at {templeName}. Thank you for your support!' }
      },
      eventReminder: {
        whatsapp: { type: String, default: 'Reminder: {eventName} is on {eventDate} at {templeName}. Your participation is valuable.' },
        sms: { type: String, default: 'Reminder: {eventName} on {eventDate} at {templeName}.' }
      }
    }
  },

  // System Preferences
  systemPrefs: {
    currency: { type: String, default: 'INR' },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    fiscalYearStart: { type: String, default: '04-01' }, // April 1st
    backupFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
    backupRetention: { type: Number, default: 30 }, // days
    sessionTimeout: { type: Number, default: 60 }, // minutes
    passwordPolicy: {
      minLength: { type: Number, default: 8 },
      requireUppercase: { type: Boolean, default: true },
      requireLowercase: { type: Boolean, default: true },
      requireNumbers: { type: Boolean, default: true },
      requireSpecialChars: { type: Boolean, default: false }
    }
  },

  // Financial Settings
  financialConfig: {
    defaultFundCategories: [{
      name: String,
      description: String,
      isActive: { type: Boolean, default: true }
    }],
    expenseCategories: [{
      name: String,
      description: String,
      isActive: { type: Boolean, default: true }
    }],
    autoApprovalLimits: {
      expenses: { type: Number, default: 0 }, // 0 means no auto-approval
      donations: { type: Number, default: 0 }
    },
    taxSettings: {
      gstNumber: String,
      panNumber: String,
      taxExemptionCertificate: String,
      enable80GReceipts: { type: Boolean, default: true }
    }
  },

  // Inventory Settings
  inventoryConfig: {
    enableBarcodes: { type: Boolean, default: true },
    barcodeType: { type: String, enum: ['qr', 'code128', 'ean13'], default: 'qr' },
    expiryAlertDays: { type: Number, default: 7 },
    lowStockThreshold: { type: Number, default: 10 },
    defaultStorageLocation: { type: String, default: 'Main Store' },
    enablePhotoCapture: { type: Boolean, default: false }
  },

  // Event Management
  eventConfig: {
    recurringEvents: [{
      name: String,
      type: { type: String, enum: ['lunar', 'solar', 'weekly', 'monthly', 'yearly'] },
      frequency: String, // e.g., 'every-new-moon', 'monthly-1st', 'yearly-01-01'
      isActive: { type: Boolean, default: true }
    }],
    enableEventReminders: { type: Boolean, default: true },
    reminderDaysBefore: { type: Number, default: 3 },
    enableDonorInvitations: { type: Boolean, default: false }
  },

  // Security Settings
  security: {
    enableTwoFactorAuth: { type: Boolean, default: false },
    allowMultipleLogins: { type: Boolean, default: true },
    enableAuditLogging: { type: Boolean, default: true },
    allowGuestAccess: { type: Boolean, default: false },
    ipWhitelist: [String],
    enableDataEncryption: { type: Boolean, default: true }
  },

  // Integration Settings
  integrations: {
    upiConfig: {
      enabled: { type: Boolean, default: false },
      merchantId: String,
      apiKey: String,
      webhook: String
    },
    paymentGateway: {
      provider: { type: String, enum: ['razorpay', 'payu', 'ccavenue', 'none'], default: 'none' },
      keyId: String,
      keySecret: String,
      webhookSecret: String
    },
    googleServices: {
      mapsApiKey: String,
      analyticsId: String,
      driveIntegration: { type: Boolean, default: false }
    }
  },

  // Metadata
  version: { type: String, default: '1.0.0' },
  lastUpdated: { type: Date, default: Date.now },
  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingsSchema.index({}, { unique: true });

// Pre-save middleware to update lastUpdated
settingsSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Settings', settingsSchema);