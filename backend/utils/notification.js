const axios = require('axios');
const nodemailer = require('nodemailer');
const Settings = require('../models/Settings');
const NotificationLog = require('../models/NotificationLog');
const { decryptNotifSecrets } = require('./encrypt');

// ─── Interpolation ────────────────────────────────────────────────────────────
// Replaces {varName} placeholders in a template string
const interpolate = (template, vars) => {
  if (!template) return '';
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] !== undefined ? vars[key] : `{${key}}`);
};

// ─── Logging ──────────────────────────────────────────────────────────────────
const logNotification = async (fields) => {
  try {
    await NotificationLog.create(fields);
  } catch (err) {
    console.error('[NotificationLog] Failed to save log:', err.message);
  }
};

// ─── WhatsApp Business Cloud API ──────────────────────────────────────────────
const sendWhatsApp = async (to, templateName, variables, config) => {
  if (!config.apiKey || !config.phoneNumberId) {
    throw new Error('WhatsApp Access Token and Phone Number ID are required');
  }

  const formattedTo = to.startsWith('91') ? to : `91${to}`;

  // Build positional parameters from variables object (order matters for template)
  const parameters = Object.values(variables || {}).map(val => ({
    type: 'text',
    text: String(val)
  }));

  const payload = {
    messaging_product: 'whatsapp',
    to: formattedTo,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'en_US' },
      // Only include components if the template has variables (hello_world has none)
      ...(parameters.length > 0 && {
        components: [{ type: 'body', parameters }]
      })
    }
  };

  const response = await axios.post(
    `https://graph.facebook.com/v20.0/${config.phoneNumberId}/messages`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
};

// ─── MSG91 SMS ────────────────────────────────────────────────────────────────
const sendSMS = async (to, templateId, variables, config) => {
  if (!config.apiKey || !config.senderId) {
    throw new Error('MSG91 API Key and Sender ID are required');
  }
  if (!templateId) {
    throw new Error('DLT Template ID is required for SMS');
  }

  const formattedTo = to.startsWith('91') ? to : `91${to}`;

  const payload = {
    template_id: templateId,
    short_url: '0',
    realTimeResponse: '1',
    recipients: [
      {
        mobiles: formattedTo,
        ...variables // spread named vars — MSG91 Flow maps them to {#var#} placeholders
      }
    ]
  };

  const response = await axios.post(
    'https://control.msg91.com/api/v5/flow/',
    payload,
    {
      headers: {
        authkey: config.apiKey,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
};

// ─── Nodemailer Email ─────────────────────────────────────────────────────────
const sendEmail = async (to, subject, htmlBody, config) => {
  if (!config.host || !config.username || !config.password) {
    throw new Error('SMTP Host, Username, and Password are required');
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port || 587,
    secure: config.port === 465,
    auth: {
      user: config.username,
      pass: config.password
    }
  });

  const info = await transporter.sendMail({
    from: `"${config.fromName || 'Temple Tracker'}" <${config.fromEmail || config.username}>`,
    to,
    subject,
    html: htmlBody,
    text: htmlBody.replace(/<[^>]+>/g, '') // strip HTML for plain-text fallback
  });

  return info;
};

// ─── Variable Builders ────────────────────────────────────────────────────────
const buildVariables = (trigger, data, settings) => {
  const templeName = settings?.templeConfig?.name || 'Temple';
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  if (trigger === 'donation') {
    const itemList = (data.items || [])
      .map(i => `${i.itemType} (${i.quantity} ${i.unit})`)
      .join(', ');
    return {
      donorName: data.donor?.name || 'Devotee',
      amount: data.amount ? `₹${data.amount}` : '',
      event: data.event || 'General',
      receiptId: data.receiptId || '',
      itemList: itemList || '',
      templeName,
      date
    };
  }

  if (trigger === 'inventoryUsed') {
    return {
      donorName: data.donor?.name || 'Devotee',
      itemType: data.itemType || '',
      quantity: data.quantity || '',
      unit: data.unit || '',
      purpose: data.purpose || '',
      templeName,
      date
    };
  }

  if (trigger === 'expiryAlert') {
    return {
      itemName: data.itemName || '',
      quantity: data.quantity || '',
      expiryDate: data.expiryDate || '',
      daysLeft: data.daysLeft || '',
      templeName
    };
  }

  if (trigger === 'eventReminder') {
    return {
      eventName: data.eventName || '',
      eventDate: data.eventDate || '',
      daysLeft: data.daysLeft || '',
      templeName
    };
  }

  return {};
};

const getTemplateKey = (trigger, donationType) => {
  if (trigger === 'donation') {
    if (donationType === 'upi') return 'donationUpi';
    if (donationType === 'in-kind') return 'donationInkind';
    return 'donationCash';
  }
  return trigger; // 'inventoryUsed', 'expiryAlert', 'eventReminder'
};

// ─── Main Orchestrator ────────────────────────────────────────────────────────
const sendNotification = async (trigger, data, requestingUser) => {
  try {
    const settings = await Settings.findOne();
    if (!settings) return;

    const notif = decryptNotifSecrets(
      settings.notifications?.toObject ? settings.notifications.toObject() : settings.notifications
    );
    if (!notif) return;

    const prefs = notif.notificationPreferences?.[trigger];
    if (!prefs?.enabled) return;

    const channels = prefs.channels || {};
    const templateKey = getTemplateKey(trigger, data.type);
    const template = notif.templates?.[templateKey];
    if (!template) return;

    const variables = buildVariables(trigger, data, settings);
    const donorPhone = data.donor?.mobile;
    const donorEmail = data.donor?.email;
    const referenceId = data.referenceId;
    const referenceType = data.referenceType;

    const tasks = [];

    // WhatsApp — donor
    if (channels.whatsapp && notif.enableWhatsApp && donorPhone) {
      const templateName = template.whatsappTemplateName;
      tasks.push(
        sendWhatsApp(donorPhone, templateName, variables, notif.whatsAppConfig)
          .then(() => logNotification({
            trigger, channel: 'whatsapp', recipient: donorPhone,
            recipientName: data.donor?.name, status: 'sent',
            templateUsed: templateName, referenceId, referenceType
          }))
          .catch(err => logNotification({
            trigger, channel: 'whatsapp', recipient: donorPhone,
            recipientName: data.donor?.name, status: 'failed',
            error: err.response?.data?.error?.message || err.message,
            templateUsed: templateName, referenceId, referenceType
          }))
      );
    }

    // SMS — donor
    if (channels.sms && notif.enableSMS && donorPhone) {
      const templateId = notif.smsConfig?.dltTemplateIds?.[templateKey];
      tasks.push(
        sendSMS(donorPhone, templateId, variables, notif.smsConfig)
          .then(() => logNotification({
            trigger, channel: 'sms', recipient: donorPhone,
            recipientName: data.donor?.name, status: 'sent',
            templateUsed: templateId, referenceId, referenceType
          }))
          .catch(err => logNotification({
            trigger, channel: 'sms', recipient: donorPhone,
            recipientName: data.donor?.name, status: 'failed',
            error: err.response?.data?.message || err.message,
            templateUsed: templateId, referenceId, referenceType
          }))
      );
    }

    // Email — donor
    if (channels.email && notif.enableEmail && donorEmail) {
      const subject = interpolate(template.emailSubject || '', variables);
      const body = interpolate(template.emailBody || '', variables);
      tasks.push(
        sendEmail(donorEmail, subject, body, notif.emailConfig)
          .then(() => logNotification({
            trigger, channel: 'email', recipient: donorEmail,
            recipientName: data.donor?.name, status: 'sent',
            templateUsed: subject, referenceId, referenceType
          }))
          .catch(err => logNotification({
            trigger, channel: 'email', recipient: donorEmail,
            recipientName: data.donor?.name, status: 'failed',
            error: err.message, templateUsed: subject, referenceId, referenceType
          }))
      );
    }

    await Promise.allSettled(tasks);
  } catch (err) {
    console.error(`[sendNotification] Unexpected error for trigger "${trigger}":`, err.message);
  }
};

// ─── Direct channel senders (used by testNotification) ───────────────────────
const sendDirectWhatsApp = sendWhatsApp;
const sendDirectSMS = sendSMS;
const sendDirectEmail = sendEmail;

// Keep legacy template helpers for backward compatibility (used in old controller code)
const templates = {
  donationConfirmation: (donorName, amount, templeName, event) => ({
    subject: `Donation Confirmation - ${templeName}`,
    message: `Thank you ${donorName} for your ₹${amount} donation to ${templeName}${event ? ` for ${event}` : ''}.`
  }),
  itemUsageNotification: (donorName, item, quantity, purpose, templeName) => ({
    subject: `Item Usage Notification - ${templeName}`,
    message: `Dear ${donorName}, your donated ${item} (${quantity}) was used for ${purpose} at ${templeName}.`
  }),
  eventReminder: (donorName, eventName, eventDate, templeName) => ({
    subject: `Event Reminder - ${eventName} at ${templeName}`,
    message: `Dear ${donorName}, reminder about ${eventName} on ${eventDate} at ${templeName}.`
  })
};

module.exports = {
  sendNotification,
  sendDirectWhatsApp,
  sendDirectSMS,
  sendDirectEmail,
  interpolate,
  templates
};
