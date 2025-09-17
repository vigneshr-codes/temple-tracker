const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  updateSettingsSection,
  resetSettings,
  testNotification,
  getBackupInfo,
  createBackup
} = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

// All routes require admin authorization
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getSettings)
  .put(updateSettings);

router.route('/:section')
  .put(updateSettingsSection);

router.route('/reset')
  .post(resetSettings);

router.route('/test-notification')
  .post(testNotification);

router.route('/backup-info')
  .get(getBackupInfo);

router.route('/backup')
  .post(createBackup);

module.exports = router;