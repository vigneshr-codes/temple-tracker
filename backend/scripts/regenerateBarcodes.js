/**
 * One-time script: regenerate QR code labels for all inventory items
 * using the temple name stored in Settings.
 *
 * Usage:
 *   node scripts/regenerateBarcodes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const Settings = require('../models/Settings');
const { generateBarcodeData, createBarcodeLabel } = require('../utils/barcode');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const settings = await Settings.findOne().select('templeConfig.name');
  const templeName = settings?.templeConfig?.name || 'Temple';
  console.log(`Temple name: "${templeName}"`);

  const items = await Inventory.find({ 'barcode.data': { $exists: true } });
  console.log(`Found ${items.length} items with existing barcodes`);

  let updated = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const barcodeData = generateBarcodeData(item);
      const barcodeLabel = await createBarcodeLabel(item, templeName);
      item.barcode = { data: JSON.stringify(barcodeData), image: barcodeLabel };
      await item.save();
      updated++;
      process.stdout.write(`\rUpdated ${updated}/${items.length}...`);
    } catch (err) {
      failed++;
      console.error(`\nFailed for item ${item.inventoryId}: ${err.message}`);
    }
  }

  console.log(`\nDone. Updated: ${updated}, Failed: ${failed}`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
