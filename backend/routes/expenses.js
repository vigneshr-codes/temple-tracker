const express = require('express');
const { body } = require('express-validator');
const {
  createExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
  approveExpense,
  generateChallan,
  getAvailableInventory
} = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation rules for expense creation
const expenseValidation = [
  body('category').notEmpty().withMessage('Category is required'),
  body('amount').isNumeric().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('description').notEmpty().withMessage('Description is required'),
  body('vendor.name').notEmpty().withMessage('Vendor name is required'),
  body('billDate').isISO8601().withMessage('Please provide a valid bill date'),
  body('paymentMethod').isIn(['cash', 'upi', 'bank-transfer', 'cheque']).withMessage('Invalid payment method'),
];

router.use(protect);

// Get available inventory for linking
router.route('/inventory/available')
  .get(getAvailableInventory);

router.route('/')
  .get(getExpenses)
  .post(expenseValidation, createExpense);

router.route('/:id')
  .get(getExpense)
  .put(updateExpense)
  .delete(authorize('admin'), deleteExpense);

router.route('/:id/approve')
  .put(authorize('admin'), approveExpense);

router.route('/:id/challan')
  .get(generateChallan);

module.exports = router;