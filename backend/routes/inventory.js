const express = require('express');
const { body } = require('express-validator');
const {
  getInventory,
  getInventoryItem,
  updateInventoryItem,
  useInventoryItem,
  generateBarcode,
  scanBarcode,
  getExpiringItems
} = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getInventory);

router.route('/expiring')
  .get(getExpiringItems);

router.route('/:id')
  .get(getInventoryItem)
  .put(authorize('admin'), updateInventoryItem);

router.route('/:id/use')
  .post([
    body('quantityUsed').isNumeric().isFloat({ min: 0 }).withMessage('Quantity used must be a positive number'),
    body('purpose').notEmpty().withMessage('Purpose is required'),
  ], useInventoryItem);

router.route('/:id/barcode')
  .post(generateBarcode);

router.route('/scan/:barcode')
  .get(scanBarcode);

module.exports = router;