const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Settings = require('../models/Settings');
const { encryptNotifSecrets, decryptNotifSecrets } = require('../utils/encrypt');

// Multer config for logo uploads
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/logos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `temple-logo${ext}`);
  }
});
const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const allowedMime = /image\/(jpeg|png|webp)/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowedMime.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});
// @desc    Upload temple logo
// @route   POST /api/settings/logo
// @access  Private (Admin only)
const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const logoUrl = `/uploads/logos/${req.file.filename}`;
    await Settings.findOneAndUpdate(
      {},
      { $set: { 'templeConfig.logo': logoUrl, updatedBy: req.user._id } },
      { upsert: true }
    );
    res.status(200).json({ success: true, data: { logoUrl } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public settings (temple name, logo, contact) - no auth required
// @route   GET /api/settings/public
// @access  Public
const getPublicSettings = async (req, res, next) => {
  try {
    const settings = await Settings.findOne().select('templeConfig systemPrefs.language systemPrefs.currency financialConfig.taxSettings');
    res.status(200).json({
      success: true,
      data: {
        templeConfig: settings?.templeConfig || { name: 'Temple Tracker' },
        language: settings?.systemPrefs?.language || 'en',
        currency: settings?.systemPrefs?.currency || 'INR',
        taxSettings: settings?.financialConfig?.taxSettings || {}
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system settings
// @route   GET /api/settings
// @access  Private (Admin only)
const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne().populate('updatedBy', 'name username');
    
    if (!settings) {
      // Create default settings if none exist
      settings = await Settings.create({
        templeConfig: {
          name: 'Temple Management System'
        },
        updatedBy: req.user._id
      });
      settings = await Settings.findById(settings._id).populate('updatedBy', 'name username');
    }

    // Decrypt sensitive notification secrets before sending to frontend
    const data = settings.toObject ? settings.toObject() : settings;
    if (data.notifications) data.notifications = decryptNotifSecrets(data.notifications);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private (Admin only)
const updateSettings = async (req, res, next) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };

    let settings = await Settings.findOneAndUpdate(
      {},
      updateData,
      { 
        new: true, 
        upsert: true,
        runValidators: true 
      }
    ).populate('updatedBy', 'name username');

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update specific setting section
// @route   PUT /api/settings/:section
// @access  Private (Admin only)
const updateSettingsSection = async (req, res, next) => {
  try {
    const { section } = req.params;
    const validSections = [
      'templeConfig', 
      'notifications', 
      'systemPrefs', 
      'financialConfig', 
      'inventoryConfig', 
      'eventConfig', 
      'security', 
      'integrations'
    ];

    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings section'
      });
    }

    const sectionData = section === 'notifications'
      ? encryptNotifSecrets(JSON.parse(JSON.stringify(req.body)))
      : req.body;

    const updateData = {
      [section]: sectionData,
      updatedBy: req.user._id,
      lastUpdated: new Date()
    };

    let settings = await Settings.findOneAndUpdate(
      {},
      { $set: updateData },
      { 
        new: true, 
        upsert: true,
        runValidators: true 
      }
    ).populate('updatedBy', 'name username');

    res.status(200).json({
      success: true,
      message: `${section} settings updated successfully`,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset settings to default
// @route   POST /api/settings/reset
// @access  Private (Admin only)
const resetSettings = async (req, res, next) => {
  try {
    // Delete existing settings
    await Settings.deleteOne({});

    // Create new default settings
    const settings = await Settings.create({
      templeConfig: {
        name: 'Temple Management System'
      },
      updatedBy: req.user._id
    });

    const populatedSettings = await Settings.findById(settings._id).populate('updatedBy', 'name username');

    res.status(200).json({
      success: true,
      message: 'Settings reset to default successfully',
      data: populatedSettings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Test notification settings
// @route   POST /api/settings/test-notification
// @access  Private (Admin only)
const testNotification = async (req, res, next) => {
  try {
    const { channel, recipient } = req.body;

    if (!channel || !recipient) {
      return res.status(400).json({
        success: false,
        message: 'Channel and recipient are required'
      });
    }

    const { sendDirectWhatsApp, sendDirectSMS, sendDirectEmail, interpolate } = require('../utils/notification');
    const NotificationLog = require('../models/NotificationLog');

    const settings = await Settings.findOne();
    const notif = decryptNotifSecrets(settings?.notifications?.toObject
      ? settings.notifications.toObject()
      : settings?.notifications);
    const templeName = settings?.templeConfig?.name || 'Temple';

    const testVars = {
      donorName: 'Test Devotee',
      amount: '₹1001',
      event: 'Test Event',
      receiptId: 'TEST-001',
      itemList: 'Rice (5 kg)',
      itemType: 'Rice',
      quantity: '5',
      unit: 'kg',
      purpose: 'prasadam',
      templeName,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    const logEntry = { trigger: 'test', channel, recipient, recipientName: 'Test' };

    try {
      if (channel === 'whatsapp') {
        if (!notif?.whatsAppConfig?.apiKey) throw new Error('WhatsApp not configured — add Access Token in Channel Configuration');
        const tmplName = notif.templates?.donationCash?.whatsappTemplateName || 'donation_thankyou_cash';
        // hello_world accepts no parameters; custom templates get the full test variable set
        const waVars = tmplName === 'hello_world' ? {} : testVars;
        await sendDirectWhatsApp(recipient, tmplName, waVars, notif.whatsAppConfig);
        logEntry.templateUsed = tmplName;
      } else if (channel === 'sms') {
        if (!notif?.smsConfig?.apiKey) throw new Error('SMS not configured — add MSG91 API Key in Channel Configuration');
        const templateId = notif.smsConfig?.dltTemplateIds?.donationCash;
        await sendDirectSMS(recipient, templateId, testVars, notif.smsConfig);
        logEntry.templateUsed = templateId;
      } else if (channel === 'email') {
        if (!notif?.emailConfig?.host) throw new Error('Email not configured — add SMTP settings in Channel Configuration');
        const tpl = notif.templates?.donationCash;
        const subject = interpolate(tpl?.emailSubject || 'Test Notification from {templeName}', testVars);
        const body = interpolate(tpl?.emailBody || '<p>This is a test notification from <strong>{templeName}</strong>.</p><p>If you received this, email notifications are working correctly.</p>', testVars);
        await sendDirectEmail(recipient, subject, body, notif.emailConfig);
        logEntry.templateUsed = subject;
      } else {
        return res.status(400).json({ success: false, message: 'Invalid channel. Must be whatsapp, sms, or email' });
      }

      logEntry.status = 'sent';
      await NotificationLog.create(logEntry);

      res.status(200).json({
        success: true,
        message: `Test ${channel} notification sent to ${recipient}`
      });
    } catch (sendErr) {
      logEntry.status = 'failed';
      logEntry.error = sendErr.response?.data?.error?.message || sendErr.message;
      await NotificationLog.create(logEntry).catch(() => {});

      res.status(200).json({
        success: false,
        message: `Test failed: ${logEntry.error}`
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get notification logs
// @route   GET /api/settings/notification-logs
// @access  Private (Admin only)
const getNotificationLogs = async (req, res, next) => {
  try {
    const NotificationLog = require('../models/NotificationLog');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.channel) filter.channel = req.query.channel;
    if (req.query.trigger) filter.trigger = req.query.trigger;

    const logs = await NotificationLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await NotificationLog.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system backup info
// @route   GET /api/settings/backup-info
// @access  Private (Admin only)
const getBackupInfo = async (req, res, next) => {
  try {
    // TODO: Implement actual backup status checking
    // This would check backup files, dates, sizes, etc.
    
    const backupInfo = {
      lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      nextBackup: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      backupSize: '125.6 MB',
      backupCount: 15,
      backupLocation: '/backups/temple-db',
      status: 'healthy'
    };

    res.status(200).json({
      success: true,
      data: backupInfo
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger manual backup
// @route   POST /api/settings/backup
// @access  Private (Admin only)
const createBackup = async (req, res, next) => {
  try {
    // TODO: Implement actual backup creation
    // This would create database backup, file backup, etc.
    
    const backup = {
      id: Date.now().toString(),
      timestamp: new Date(),
      size: '125.8 MB',
      type: 'manual',
      status: 'completed',
      createdBy: req.user.name
    };

    res.status(200).json({
      success: true,
      message: 'Backup created successfully',
      data: backup
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicSettings,
  uploadLogo,
  logoUpload,
  getSettings,
  updateSettings,
  updateSettingsSection,
  resetSettings,
  testNotification,
  getNotificationLogs,
  getBackupInfo,
  createBackup
};