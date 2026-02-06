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
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(checkPermission('inventory', 'read'), getInventory);

router.route('/expiring')
  .get(checkPermission('inventory', 'read'), getExpiringItems);

router.route('/:id')
  .get(checkPermission('inventory', 'read'), getInventoryItem)
  .put(checkPermission('inventory', 'update'), updateInventoryItem);

router.route('/:id/use')
  .post(checkPermission('inventory', 'update'), [
    body('quantityUsed').isNumeric().isFloat({ min: 0 }).withMessage('Quantity used must be a positive number'),
    body('purpose').notEmpty().withMessage('Purpose is required'),
  ], useInventoryItem);

router.route('/:id/barcode')
  .post(checkPermission('inventory', 'read'), generateBarcode);

router.route('/scan/:barcode')
  .get(checkPermission('inventory', 'read'), scanBarcode);

module.exports = router;