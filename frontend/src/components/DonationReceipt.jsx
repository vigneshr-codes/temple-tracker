import { PrinterIcon } from '@heroicons/react/24/outline';
import { useSelector } from 'react-redux';
import { BACKEND_STATIC_URL } from '../features/settings/settingsSlice';

const escHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

const ONES = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
const TENS = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

function numToWords(n) {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n/10)] + (n%10 ? ' '+ONES[n%10] : '');
  if (n < 1000) return ONES[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' '+numToWords(n%100) : '');
  if (n < 100000) return numToWords(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' '+numToWords(n%1000) : '');
  if (n < 10000000) return numToWords(Math.floor(n/100000)) + ' Lakh' + (n%100000 ? ' '+numToWords(n%100000) : '');
  return numToWords(Math.floor(n/10000000)) + ' Crore' + (n%10000000 ? ' '+numToWords(n%10000000) : '');
}

function amountInWords(amount) {
  if (!amount || amount === 0) return 'Zero Only';
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let words = 'Rupees ' + numToWords(rupees);
  if (paise > 0) words += ' and ' + numToWords(paise) + ' Paise';
  return words + ' Only';
}

function buildReceiptHTML({ donation, templeConfig, logoDataUrl }) {
  const tc = templeConfig || {};
  const addr = tc.address || {};
  const addressLine = [addr.street, addr.city, addr.state].filter(Boolean).join(', ');
  const pincode = addr.pincode ? ` - ${addr.pincode}` : '';
  const phone = tc.contact?.phone || '';
  const isInKind = donation.type === 'in-kind';
  const isDonation = !donation.isCorpusDonation;

  const receiptNo = escHtml(donation.donationId || '');
  const date = new Date(donation.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const logoTag = logoDataUrl
    ? `<img src="${logoDataUrl}" alt="logo">`
    : '';

  const regPanLine = [
    tc.registrationNumber ? `Regn No.: ${escHtml(tc.registrationNumber)}` : '',
    tc.panNumber ? `PAN: ${escHtml(tc.panNumber)}` : ''
  ].filter(Boolean).join('&nbsp;&nbsp;&nbsp;');

  const exemptionLine = [
    tc.exemption80GNumber ? `80G: ${escHtml(tc.exemption80GNumber)}` : '',
    tc.exemption12ANumber ? `12A: ${escHtml(tc.exemption12ANumber)}` : ''
  ].filter(Boolean).join('&nbsp;&nbsp;&nbsp;');

  // Donor rows
  const donorName = donation.isAnonymous ? 'Anonymous' : (donation.donor?.name || '');
  let donorRows = `<tr><td class="lbl">Received from</td><td class="val">${escHtml(donorName)}</td></tr>`;
  if (donation.donor?.panNumber) donorRows += `<tr><td class="lbl">PAN / Aadhaar</td><td class="val">${escHtml(donation.donor.panNumber)}</td></tr>`;
  if (donation.donor?.mobile)    donorRows += `<tr><td class="lbl">Mobile</td><td class="val">${escHtml(donation.donor.mobile)}</td></tr>`;

  // Donation rows
  let donationRows = '';
  if (isInKind) {
    donationRows += `<tr><td class="lbl">Nature</td><td class="val">In-Kind (Materials)</td></tr>`;
    const itemLines = (donation.items || []).map(i => `${escHtml(String(i.quantity))} ${escHtml(i.unit)} of ${escHtml(i.itemType)}`).join('<br>');
    donationRows += `<tr><td class="lbl">Items</td><td class="val">${itemLines || '—'}</td></tr>`;
  } else {
    const modeLabel = { cash: 'Cash', upi: 'UPI', cheque: 'Cheque', neft: 'NEFT', rtgs: 'RTGS' }[donation.type] || donation.type || '';
    donationRows += `<tr><td class="lbl">Payment Mode</td><td class="val">${escHtml(modeLabel)}</td></tr>`;
    if (donation.type === 'upi' && donation.upiDetails?.transactionId)
      donationRows += `<tr><td class="lbl">UPI Ref.</td><td class="val">${escHtml(donation.upiDetails.transactionId)}</td></tr>`;
    if (donation.type === 'cheque') {
      const ch = donation.chequeDetails || {};
      if (ch.chequeNumber) donationRows += `<tr><td class="lbl">Cheque No.</td><td class="val">${escHtml(ch.chequeNumber)}</td></tr>`;
      if (ch.bankName)     donationRows += `<tr><td class="lbl">Bank</td><td class="val">${escHtml(ch.bankName)}</td></tr>`;
      if (ch.chequeDate)   donationRows += `<tr><td class="lbl">Cheque Date</td><td class="val">${new Date(ch.chequeDate).toLocaleDateString('en-IN')}</td></tr>`;
    }
    if (donation.type === 'neft' || donation.type === 'rtgs') {
      const ref = donation.neftDetails?.referenceNumber || donation.rtgsDetails?.referenceNumber || '';
      if (ref) donationRows += `<tr><td class="lbl">Reference No.</td><td class="val">${escHtml(ref)}</td></tr>`;
    }
  }

  const amountBar = !isInKind ? `
    <div class="amount-bar">
      <div class="amount-words">In Words: ${escHtml(amountInWords(donation.amount))}</div>
      <div class="amount-figure">&#8377;${(donation.amount || 0).toLocaleString('en-IN')}</div>
    </div>` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - ${receiptNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Arial', sans-serif; padding: 24px; background: #f3f4f6; }
    ${logoDataUrl ? `body::before {
      content: '';
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 320px; height: 320px;
      background-image: url('${logoDataUrl}');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      opacity: 0.07;
      pointer-events: none;
      z-index: 0;
    }` : ''}

    .no-print { text-align: center; margin-bottom: 18px; }
    .btn-print { padding: 8px 24px; font-size: 14px; background: #b45309; color: #fff; border: none; border-radius: 6px; cursor: pointer; margin-right: 8px; }
    .btn-close  { padding: 8px 24px; font-size: 14px; background: #6b7280; color: #fff; border: none; border-radius: 6px; cursor: pointer; }

    .card {
      max-width: 720px; margin: 0 auto;
      background: #fff; border: 1px solid #d1d5db;
      border-radius: 12px; overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.10);
    }

    /* Gold top accent stripe */
    .top-stripe {
      height: 5px;
      background: linear-gradient(90deg, #d97706, #f59e0b, #fbbf24, #f59e0b, #d97706);
    }

    /* Header */
    .header {
      display: flex; align-items: center;
      padding: 20px 24px 16px; border-bottom: 1px solid #e5e7eb; gap: 0;
    }
    .header-spacer { flex-shrink: 0; width: 88px; }
    .header-text { flex: 1; text-align: center; }
    .temple-name {
      font-size: 18px; font-weight: 800; color: #111827;
      line-height: 1.4; margin-bottom: 6px; letter-spacing: 0.01em;
    }
    .name-line { display: block; white-space: nowrap; }
    .header-sub  { font-size: 14px; color: #6b7280; margin: 3px 0; }
    .header-ids  { font-size: 13px; color: #9ca3af; margin-top: 5px; letter-spacing: 0.02em; }
    .logo-box {
      flex-shrink: 0; width: 88px; height: 88px;
      border-radius: 50%; overflow: hidden;
      border: 2px solid #fde68a;
      box-shadow: 0 0 0 4px #fffbeb;
      display: flex; align-items: center; justify-content: center;
      background: #fffbeb;
    }
    .logo-box img { width: 88px; height: 88px; object-fit: contain; }

    /* RECEIPT banner */
    .receipt-banner {
      background: linear-gradient(135deg, #92400e 0%, #b45309 50%, #92400e 100%);
      text-align: center; padding: 8px;
      font-size: 13px; font-weight: bold; letter-spacing: 6px; color: #fef3c7;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }

    /* No + Date */
    .meta-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 7px 24px; border-bottom: 1px solid #f3f4f6; background: #fafafa;
    }
    .meta-lbl { font-size: 9px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
    .meta-val  { font-size: 13px; font-weight: 700; color: #111827; margin-left: 4px; }

    /* 2-column content grid */
    .content-grid { display: flex; }
    .section { flex: 1; padding: 14px 24px; border-right: 1px solid #f3f4f6; }
    .section:last-child { border-right: none; }
    .section-title {
      font-size: 9px; font-weight: 800; letter-spacing: 0.1em;
      text-transform: uppercase; color: #b45309;
      border-bottom: 2px solid #fde68a; padding-bottom: 5px; margin-bottom: 10px;
    }
    .detail-table { width: 100%; border-collapse: collapse; }
    .detail-table tr { border-bottom: 1px dotted #e5e7eb; }
    .detail-table tr:last-child { border-bottom: none; }
    .lbl { font-size: 9.5px; color: #9ca3af; padding: 5px 10px 5px 0; vertical-align: top; white-space: nowrap; }
    .val { font-size: 12px; font-weight: 600; color: #111827; padding: 5px 0; vertical-align: top; }

    /* Amount bar */
    .amount-bar {
      display: flex; justify-content: space-between; align-items: center;
      background: linear-gradient(135deg, #fffbeb, #fef3c7);
      border-top: 1px solid #fde68a; border-bottom: 1px solid #fde68a;
      padding: 10px 24px;
    }
    .amount-words  { font-size: 10.5px; font-style: italic; color: #92400e; flex: 1; padding-right: 20px; line-height: 1.4; }
    .amount-figure { font-size: 22px; font-weight: 800; color: #78350f; white-space: nowrap; letter-spacing: -0.5px; }

    /* Footer */
    .footer-row {
      display: flex; justify-content: space-between; align-items: flex-end;
      padding: 12px 24px 18px; background: #fafafa; border-top: 1px solid #f3f4f6;
    }
    .checkboxes { display: flex; gap: 20px; font-size: 10.5px; color: #374151; }
    .checkboxes label { display: flex; align-items: center; gap: 4px; }
    .signature-block { text-align: center; padding-top: 52px; }
    .signature-line { border-top: 1.5px solid #374151; padding-top: 6px; font-size: 10px; color: #374151; min-width: 170px; letter-spacing: 0.05em; }

    @media print {
      @page { margin: 0.4cm; }
      body { padding: 0; background: #fff; }
      .no-print { display: none !important; }
      .card { box-shadow: none; border-radius: 0; border: 1px solid #ccc; max-width: 100%; page-break-inside: avoid; }
      .top-stripe { height: 3px; }
      .header { padding: 8px 16px 6px; }
      .header-spacer { width: 64px; }
      .logo-box { width: 64px; height: 64px; box-shadow: none; }
      .logo-box img { width: 64px; height: 64px; }
      .temple-name { font-size: 14px; }
      .header-sub { font-size: 13px; }
      .header-ids { font-size: 12px; }
      .receipt-banner { padding: 5px; font-size: 11px; letter-spacing: 5px; }
      .meta-row { padding: 4px 16px; }
      .section { padding: 8px 16px; }
      .amount-bar { padding: 6px 16px; }
      .amount-figure { font-size: 18px; }
      .footer-row { padding: 6px 16px 10px; }
      .signature-block { padding-top: 36px; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="btn-print" onclick="window.print()">Print Receipt</button>
    <button class="btn-close" onclick="window.close()">Close</button>
  </div>
  <div class="card">
    <div class="top-stripe"></div>
    <div class="header">
      <div class="header-spacer"></div>
      <div class="header-text">
        <div class="temple-name">${(tc.name || 'Temple').split('|').map(p => `<span class="name-line">${escHtml(p)}</span>`).join('')}</div>
        ${addressLine ? `<div class="header-sub">${escHtml(addressLine)}${escHtml(pincode)}</div>` : ''}
        ${phone ? `<div class="header-sub">Ph: ${escHtml(phone)}</div>` : ''}
        ${regPanLine ? `<div class="header-ids">${regPanLine}</div>` : ''}
        ${exemptionLine ? `<div class="header-ids">${exemptionLine}</div>` : ''}
      </div>
      ${logoTag ? `<div class="logo-box">${logoTag}</div>` : '<div class="header-spacer"></div>'}
    </div>

    <div class="receipt-banner">RECEIPT</div>

    <div class="meta-row">
      <span><span class="meta-lbl">Receipt No.&nbsp;</span><span class="meta-val">${receiptNo}</span></span>
      <span><span class="meta-lbl">Date&nbsp;</span><span class="meta-val">${date}</span></span>
    </div>

    <div class="content-grid">
      <div class="section">
        <div class="section-title">Donor Details</div>
        <table class="detail-table"><tbody>${donorRows}</tbody></table>
      </div>
      <div class="section">
        <div class="section-title">Donation Details</div>
        <table class="detail-table"><tbody>${donationRows}</tbody></table>
      </div>
    </div>

    ${amountBar}

    <div class="footer-row">
      <div class="checkboxes">
        <label><input type="checkbox" ${isDonation ? 'checked' : ''} disabled>&nbsp;Donation</label>
        <label><input type="checkbox" ${!isDonation ? 'checked' : ''} disabled>&nbsp;Corpus Donation</label>
      </div>
      <div class="signature-block">
        <div class="signature-line">Authorised Signatory</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ── React component ───────────────────────────────────────────────────────────
const DonationReceipt = ({ donation }) => {
  const { templeConfig } = useSelector(state => state.settings);

  const handlePrint = async () => {
    let logoDataUrl = null;
    if (templeConfig?.logo) {
      try {
        const logoUrl = `${BACKEND_STATIC_URL}${templeConfig.logo}`;
        const resp = await fetch(logoUrl);
        const blob = await resp.blob();
        logoDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch {
        // proceed without logo
      }
    }

    const html = buildReceiptHTML({ donation, templeConfig, logoDataUrl });
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank', 'width=780,height=680');
    win?.addEventListener('load', () => URL.revokeObjectURL(url));
  };

  return (
    <button
      type="button"
      title="Print Receipt"
      onClick={handlePrint}
      className="p-1.5 text-gray-400 hover:text-temple-600 hover:bg-temple-50 rounded transition-colors"
    >
      <PrinterIcon className="h-4 w-4" />
    </button>
  );
};

export default DonationReceipt;
