const express = require('express');
const { body } = require('express-validator');
const {
  createDonation,
  getDonations,
  getDonation,
  updateDonation,
  deleteDonation,
  generateReceipt,
  sendDonationNotification
} = require('../controllers/donationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation rules for donation creation
const donationValidation = [
  body('donor.name').notEmpty().withMessage('Donor name is required'),
  body('donor.mobile').matches(/^[6-9]\d{9}$/).withMessage('Please provide a valid 10-digit mobile number'),
  body('type').isIn(['cash', 'upi', 'in-kind']).withMessage('Invalid donation type'),
  body('amount').if(body('type').isIn(['cash', 'upi'])).isNumeric().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('upiDetails.transactionId').if(body('type').equals('upi')).notEmpty().withMessage('Transaction ID is required for UPI donations'),
  body('items').if(body('type').equals('in-kind')).isArray({ min: 1 }).withMessage('Items are required for in-kind donations'),
  body('items.*.itemType').if(body('type').equals('in-kind')).notEmpty().withMessage('Item type is required'),
  body('items.*.quantity').if(body('type').equals('in-kind')).isNumeric().isFloat({ min: 0 }).withMessage('Quantity must be a positive number'),
];

router.use(protect);

router.route('/')
  .get(getDonations)
  .post(donationValidation, createDonation);

router.route('/:id')
  .get(getDonation)
  .put(authorize('admin'), updateDonation)
  .delete(authorize('admin'), deleteDonation);

router.route('/:id/receipt')
  .post(generateReceipt);

router.route('/:id/notification')
  .post(sendDonationNotification);

module.exports = router;