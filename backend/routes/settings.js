const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

// Public route - no auth needed
router.route('/public').get(getPublicSettings);

// All routes below require admin authorization
router.use(protect);
router.use(authorize('admin'));

router.route('/logo').post(logoUpload.single('logo'), uploadLogo);

router.route('/')
  .get(getSettings)
  .put(updateSettings);

// Specific named routes MUST come before the parameterized /:section route
router.route('/reset')
  .post(resetSettings);

router.route('/test-notification')
  .post(testNotification);

router.route('/notification-logs')
  .get(getNotificationLogs);

router.route('/backup-info')
  .get(getBackupInfo);

router.route('/backup')
  .post(createBackup);

router.route('/:section')
  .put(updateSettingsSection);

module.exports = router;