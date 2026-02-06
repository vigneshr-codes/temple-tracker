import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const exportToPDF = async (elementId, filename = 'report') => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 30;
    
    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    pdf.save(`${filename}.pdf`);
    
    return { success: true };
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return { success: false, error: error.message };
  }
};

export const exportToExcel = (data, filename = 'report', sheetName = 'Report') => {
  try {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    saveAs(dataBlob, `${filename}.xlsx`);
    
    return { success: true };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return { success: false, error: error.message };
  }
};

export const exportToCSV = (data, filename = 'report') => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvData = XLSX.utils.sheet_to_csv(worksheet);
    const dataBlob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    
    saveAs(dataBlob, `${filename}.csv`);
    
    return { success: true };
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return { success: false, error: error.message };
  }
};

export const formatDataForExport = {
  financial: (data) => {
    const result = [];
    
    if (data?.summary) {
      result.push({
        Type: 'Summary',
        'Total Income': data.summary.totalIncome || 0,
        'Total Expenses': data.summary.totalExpenses || 0,
        'Net Balance': data.summary.netBalance || 0,
        'Cash on Hand': data.summary.cashOnHand || 0
      });
    }
    
    if (data?.recentTransactions) {
      result.push({}, { Type: 'Recent Transactions' });
      data.recentTransactions.forEach(transaction => {
        result.push({
          Date: new Date(transaction.date).toLocaleDateString(),
          Description: transaction.description,
          Type: transaction.type,
          Amount: transaction.amount,
          Category: transaction.category
        });
      });
    }
    
    return result;
  },
  
  donations: (data) => {
    const result = [];
    
    if (data?.summary) {
      result.push({
        Type: 'Summary',
        'Total Donations': data.summary.totalAmount || 0,
        'Total Count': data.summary.totalCount || 0,
        'Average Donation': data.summary.averageAmount || 0,
        'Unique Donors': data.summary.uniqueDonors || 0
      });
    }
    
    if (data?.topDonors) {
      result.push({}, { Type: 'Top Donors' });
      data.topDonors.forEach((donor, index) => {
        result.push({
          Rank: index + 1,
          Name: donor.name,
          Phone: donor.phone,
          'Total Donated': donor.totalDonated,
          'Donation Count': donor.donationCount,
          'Average Donation': (donor.totalDonated / donor.donationCount).toFixed(2),
          'First Donation': new Date(donor.firstDonation).toLocaleDateString(),
          'Last Donation': new Date(donor.lastDonation).toLocaleDateString()
        });
      });
    }
    
    return result;
  },
  
  expenses: (data) => {
    const result = [];
    
    if (data?.summary) {
      result.push({
        Type: 'Summary',
        'Total Expenses': data.summary.totalAmount || 0,
        'Transaction Count': data.summary.totalCount || 0,
        'Average Expense': data.summary.averageAmount || 0,
        'Unique Vendors': data.summary.uniqueVendors || 0
      });
    }
    
    if (data?.topVendors) {
      result.push({}, { Type: 'Top Vendors' });
      data.topVendors.forEach((vendor, index) => {
        result.push({
          Rank: index + 1,
          Vendor: vendor.name,
          Contact: vendor.contact,
          'Total Amount': vendor.totalAmount,
          'Transaction Count': vendor.transactionCount,
          'Average Transaction': (vendor.totalAmount / vendor.transactionCount).toFixed(2),
          'Last Transaction': new Date(vendor.lastTransaction).toLocaleDateString()
        });
      });
    }
    
    return result;
  },
  
  inventory: (data) => {
    const result = [];
    
    if (data?.summary) {
      result.push({
        Type: 'Summary',
        'Total Items': data.summary.totalItems || 0,
        'In Stock': data.summary.inStock || 0,
        'Low Stock': data.summary.lowStock || 0,
        'Out of Stock': data.summary.outOfStock || 0
      });
    }
    
    if (data?.inventoryItems) {
      result.push({}, { Type: 'Inventory Items' });
      data.inventoryItems.forEach(item => {
        result.push({
          Item: item.name,
          Category: item.category,
          'Current Stock': item.currentQuantity,
          'Minimum Stock': item.minimumQuantity,
          Unit: item.unit,
          'Unit Price': item.unitPrice || 0,
          'Total Value': ((item.currentQuantity || 0) * (item.unitPrice || 0)).toFixed(2),
          Status: item.stockStatus
        });
      });
    }
    
    return result;
  },
  
  donors: (data) => {
    const result = [];
    
    if (data?.summary) {
      result.push({
        Type: 'Summary',
        'Total Donors': data.summary.totalDonors || 0,
        'Total Contributions': data.summary.totalContributions || 0,
        'Active Donors': data.summary.activeDonors || 0,
        'Average Donation': data.summary.avgDonation || 0
      });
    }
    
    if (data?.topDonors) {
      result.push({}, { Type: 'Top Donors Analysis' });
      data.topDonors.forEach((donor, index) => {
        result.push({
          Rank: index + 1,
          Name: donor.name,
          Phone: donor.phone,
          'Total Donated': donor.totalDonated,
          'Donation Count': donor.donationCount,
          'Average Donation': (donor.totalDonated / donor.donationCount).toFixed(2),
          'First Donation': new Date(donor.firstDonation).toLocaleDateString(),
          'Last Donation': new Date(donor.lastDonation).toLocaleDateString(),
          Type: donor.type
        });
      });
    }
    
    return result;
  },
  
  balance: (data) => {
    const result = [];
    
    if (data?.summary) {
      result.push({
        Type: 'Balance Sheet Summary',
        'Total Assets': data.summary.totalAssets || 0,
        'Total Liabilities': data.summary.totalLiabilities || 0,
        'Net Worth': data.summary.netWorth || 0
      });
    }
    
    if (data?.assets) {
      result.push({}, { Type: 'Assets' });
      if (data.assets.current) {
        result.push({
          Category: 'Current Assets',
          Cash: data.assets.current.cash || 0,
          'Bank Balance': data.assets.current.bankBalance || 0,
          Inventory: data.assets.current.inventory || 0,
          Total: data.assets.current.total || 0
        });
      }
      if (data.assets.fixed) {
        result.push({
          Category: 'Fixed Assets',
          'Temple Building': data.assets.fixed.templeBuilding || 0,
          Equipment: data.assets.fixed.equipment || 0,
          Vehicles: data.assets.fixed.vehicles || 0,
          Total: data.assets.fixed.total || 0
        });
      }
    }
    
    if (data?.liabilities) {
      result.push({}, { Type: 'Liabilities' });
      if (data.liabilities.current) {
        result.push({
          Category: 'Current Liabilities',
          'Accounts Payable': data.liabilities.current.accountsPayable || 0,
          'Pending Expenses': data.liabilities.current.pendingExpenses || 0,
          Accruals: data.liabilities.current.accruals || 0,
          Total: data.liabilities.current.total || 0
        });
      }
      if (data.liabilities.longTerm) {
        result.push({
          Category: 'Long-term Liabilities',
          Loans: data.liabilities.longTerm.loans || 0,
          Mortgages: data.liabilities.longTerm.mortgages || 0,
          Total: data.liabilities.longTerm.total || 0
        });
      }
    }
    
    return result;
  }
};