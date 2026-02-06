const express = require('express');
const { body } = require('express-validator');
const {
  getFunds,
  getFund,
  createFund,
  processDonationFunds,
  allocateExpenseFromFunds,
  getFundReports,
  transferFunds
} = require('../controllers/fundController');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

const router = express.Router();

// Validation rules for fund creation
const fundValidation = [
  body('category').isIn(['general', 'maintenance', 'festival', 'anadhanam', 'construction', 'emergency']).withMessage('Invalid fund category'),
  body('description').optional().isLength({ min: 3 }).withMessage('Description must be at least 3 characters'),
];

// Validation rules for fund transfer
const transferValidation = [
  body('fromCategory').isIn(['general', 'maintenance', 'festival', 'anadhanam', 'construction', 'emergency']).withMessage('Invalid source fund category'),
  body('toCategory').isIn(['general', 'maintenance', 'festival', 'anadhanam', 'construction', 'emergency']).withMessage('Invalid destination fund category'),
  body('amount').isNumeric().isFloat({ min: 1 }).withMessage('Amount must be a positive number'),
  body('method').isIn(['cash', 'upi']).withMessage('Payment method must be cash or upi'),
  body('description').optional().isLength({ min: 3 }).withMessage('Description must be at least 3 characters'),
];

// Validation rules for expense allocation
const allocationValidation = [
  body('fundCategory').optional().isIn(['general', 'maintenance', 'festival', 'anadhanam', 'construction', 'emergency']).withMessage('Invalid fund category'),
  body('paymentMethod').optional().isIn(['cash', 'upi']).withMessage('Payment method must be cash or upi'),
];

router.use(protect);

// Fund management routes
router.route('/')
  .get(checkPermission('funds', 'read'), getFunds)
  .post(checkPermission('funds', 'create'), fundValidation, createFund);

// Fund reports
router.route('/reports')
  .get(checkPermission('funds', 'read'), getFundReports);

// Fund transfers
router.route('/transfer')
  .post(checkPermission('funds', 'allocate'), transferValidation, transferFunds);

// Process donation funds
router.route('/process-donation/:donationId')
  .post(checkPermission('funds', 'update'), processDonationFunds);

// Allocate funds for expense
router.route('/allocate-expense/:expenseId')
  .post(checkPermission('funds', 'allocate'), allocationValidation, allocateExpenseFromFunds);

// Individual fund details
router.route('/:id')
  .get(checkPermission('funds', 'read'), getFund);

module.exports = router;