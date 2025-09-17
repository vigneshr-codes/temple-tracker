const nodemailer = require('nodemailer');

// Create reusable transporter object
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send email notification
const sendEmail = async (to, subject, html, text) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.TEMPLE_NAME}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Send SMS notification (using Twilio or similar service)
const sendSMS = async (to, message) => {
  try {
    // Implementation will depend on SMS service provider
    // Example structure for Twilio integration
    console.log(`SMS to ${to}: ${message}`);
    return { success: true, message: 'SMS sent successfully' };
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
};

// Send WhatsApp notification
const sendWhatsApp = async (to, message) => {
  try {
    // Implementation will depend on WhatsApp API service
    console.log(`WhatsApp to ${to}: ${message}`);
    return { success: true, message: 'WhatsApp message sent successfully' };
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    throw error;
  }
};

// Generic notification sender
const sendNotification = async (type, to, subject, message) => {
  try {
    let result;
    
    switch (type) {
      case 'email':
        result = await sendEmail(to, subject, message, message);
        break;
      case 'sms':
        result = await sendSMS(to, message);
        break;
      case 'whatsapp':
        result = await sendWhatsApp(to, message);
        break;
      default:
        throw new Error('Invalid notification type');
    }
    
    return result;
  } catch (error) {
    console.error(`Error sending ${type} notification:`, error);
    throw error;
  }
};

// Notification templates
const templates = {
  donationConfirmation: (donorName, amount, templeName, event) => ({
    subject: `Donation Confirmation - ${templeName}`,
    message: `Thank you ${donorName} for your ₹${amount} donation to ${templeName}${event ? ` for ${event}` : ''}. Your contribution supports Anadhanam and temple activities. Receipt will be shared shortly. Om Namah Shivaya!`
  }),
  
  itemUsageNotification: (donorName, item, quantity, purpose, templeName) => ({
    subject: `Item Usage Notification - ${templeName}`,
    message: `Dear ${donorName}, your donated ${item} (${quantity}) was used today for ${purpose} in ${templeName}. Thank you for your continued support! Om Namah Shivaya!`
  }),
  
  eventReminder: (donorName, eventName, eventDate, templeName) => ({
    subject: `Event Reminder - ${eventName} at ${templeName}`,
    message: `Dear ${donorName}, this is a reminder about ${eventName} on ${eventDate} at ${templeName}. Your presence and blessings would be appreciated. Om Namah Shivaya!`
  })
};

module.exports = {
  sendEmail,
  sendSMS,
  sendWhatsApp,
  sendNotification,
  templates
};