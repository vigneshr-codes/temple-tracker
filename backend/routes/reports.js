const express = require('express');
const {
  getDashboardStats,
  getIncomeReport,
  getExpenseReport,
  getBalanceSheet,
  getInventoryReport,
  getDonorReport,
  exportReport
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/dashboard')
  .get(getDashboardStats);

router.route('/income')
  .get(getIncomeReport);

router.route('/expense')
  .get(getExpenseReport);

router.route('/balance')
  .get(getBalanceSheet);

router.route('/inventory')
  .get(getInventoryReport);

router.route('/donors')
  .get(getDonorReport);

router.route('/export')
  .post(authorize('admin'), exportReport);

module.exports = router;