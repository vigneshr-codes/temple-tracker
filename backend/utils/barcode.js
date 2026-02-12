const QRCode = require('qrcode');

// Escape HTML special characters to prevent XSS in generated HTML labels
const escapeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

// Generate QR code for inventory items
const generateQRCode = async (data) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(data), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

// Generate barcode data for inventory items
const generateBarcodeData = (inventoryItem) => {
  return {
    inventoryId: inventoryItem.inventoryId,
    itemType: inventoryItem.itemType,
    donorName: inventoryItem.donor.name,
    donorMobile: inventoryItem.donor.mobile,
    quantity: inventoryItem.quantity,
    unit: inventoryItem.unit,
    receivedDate: inventoryItem.createdAt,
    expiryDate: inventoryItem.expiryDate,
    storageLocation: inventoryItem.storageLocation
  };
};

// Create printable barcode label HTML
const createBarcodeLabel = async (inventoryItem, templeName) => {
  const barcodeData = generateBarcodeData(inventoryItem);
  const qrCode = await generateQRCode(barcodeData);
  const displayName = escapeHtml(templeName || process.env.TEMPLE_NAME || 'Temple');

  const labelHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 10px; }
        .label { border: 2px solid #000; padding: 10px; width: 250px; text-align: center; }
        .temple-name { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
        .item-info { font-size: 12px; margin: 3px 0; }
        .qr-code { margin: 10px 0; }
        .footer { font-size: 10px; margin-top: 5px; }
      </style>
    </head>
    <body>
      <div class="label">
        <div class="temple-name">${displayName}</div>
        <div class="item-info"><strong>Item:</strong> ${escapeHtml(inventoryItem.itemType.toUpperCase())}</div>
        <div class="item-info"><strong>Quantity:</strong> ${escapeHtml(String(inventoryItem.quantity))} ${escapeHtml(inventoryItem.unit)}</div>
        <div class="item-info"><strong>Donated by:</strong> ${escapeHtml(inventoryItem.donor.name)}</div>
        <div class="item-info"><strong>Date:</strong> ${new Date(inventoryItem.createdAt).toLocaleDateString()}</div>
        ${inventoryItem.expiryDate ? `<div class="item-info"><strong>Expiry:</strong> ${new Date(inventoryItem.expiryDate).toLocaleDateString()}</div>` : ''}
        <div class="qr-code">
          <img src="${qrCode}" alt="QR Code" style="width: 80px; height: 80px;">
        </div>
        <div class="item-info"><strong>ID:</strong> ${escapeHtml(inventoryItem.inventoryId)}</div>
        <div class="footer">Scan to use item</div>
      </div>
    </body>
    </html>
  `;
  
  return labelHTML;
};

// Decode scanned barcode data
const decodeBarcodeData = (scannedData) => {
  try {
    return JSON.parse(scannedData);
  } catch (error) {
    console.error('Error decoding barcode data:', error);
    throw new Error('Invalid barcode data');
  }
};

module.exports = {
  generateQRCode,
  generateBarcodeData,
  createBarcodeLabel,
  decodeBarcodeData
};