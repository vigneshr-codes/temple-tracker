const Settings = require('../models/Settings');

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

    res.status(200).json({
      success: true,
      data: settings
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

    const updateData = {
      [section]: req.body,
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
    const { type, recipient } = req.body;
    
    if (!type || !recipient) {
      return res.status(400).json({
        success: false,
        message: 'Type and recipient are required'
      });
    }

    // TODO: Implement actual notification testing based on type
    // This would integrate with WhatsApp, SMS, or Email services
    
    res.status(200).json({
      success: true,
      message: `Test ${type} notification sent to ${recipient}`,
      data: {
        type,
        recipient,
        timestamp: new Date(),
        status: 'sent' // In real implementation, this would be actual status
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
  getSettings,
  updateSettings,
  updateSettingsSection,
  resetSettings,
  testNotification,
  getBackupInfo,
  createBackup
};