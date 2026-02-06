const express = require('express');
const {
  getDashboardStats,
  getIncomeReport,
  getExpenseReport,
  getBalanceSheet,
  getInventoryReport,
  getDonorReport,
  exportReport,
  getScheduledReports,
  createScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
  getDueScheduledReports,
  executeScheduledReport
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

const router = express.Router();

router.use(protect);

// Report generation routes
router.route('/dashboard')
  .get(checkPermission('reports', 'read'), getDashboardStats);

router.route('/income')
  .get(checkPermission('reports', 'read'), getIncomeReport);

router.route('/expense')
  .get(checkPermission('reports', 'read'), getExpenseReport);

router.route('/balance')
  .get(checkPermission('reports', 'read'), getBalanceSheet);

router.route('/inventory')
  .get(checkPermission('reports', 'read'), getInventoryReport);

router.route('/donors')
  .get(checkPermission('reports', 'read'), getDonorReport);

router.route('/export')
  .post(checkPermission('reports', 'export'), exportReport);

// Scheduled reports routes
router.route('/scheduled')
  .get(checkPermission('reports', 'read'), getScheduledReports);

router.route('/schedule')
  .post(checkPermission('reports', 'create'), createScheduledReport);

router.route('/scheduled/:id')
  .patch(checkPermission('reports', 'update'), updateScheduledReport)
  .delete(checkPermission('reports', 'delete'), deleteScheduledReport);

router.route('/scheduled/due')
  .get(checkPermission('reports', 'read'), getDueScheduledReports);

router.route('/scheduled/:id/execute')
  .post(checkPermission('reports', 'export'), executeScheduledReport);

module.exports = router;