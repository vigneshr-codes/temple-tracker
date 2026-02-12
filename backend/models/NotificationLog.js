const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  trigger: {
    type: String,
    enum: ['donation', 'inventoryUsed', 'expiryAlert', 'eventReminder', 'lowStock', 'test'],
    required: true
  },
  channel: {
    type: String,
    enum: ['whatsapp', 'sms', 'email'],
    required: true
  },
  recipient: {
    type: String,
    required: true // phone number or email address
  },
  recipientName: String,
  status: {
    type: String,
    enum: ['sent', 'failed'],
    required: true
  },
  error: String,
  templateUsed: String, // template name/id used
  referenceId: {
    type: mongoose.Schema.ObjectId
  },
  referenceType: {
    type: String,
    enum: ['Donation', 'Inventory', 'Event', null]
  }
}, {
  timestamps: true
});

notificationLogSchema.index({ createdAt: -1 });
notificationLogSchema.index({ trigger: 1, status: 1 });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
