import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DocumentArrowDownIcon,
  TableCellsIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { exportToPDF, exportToExcel, exportToCSV, formatDataForExport } from '../../../utils/exportUtils';

const ExportOptions = ({ reportType, data, elementId, filename }) => {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(null);

  const handleExportPDF = async () => {
    setExporting('pdf');
    try {
      const result = await exportToPDF(elementId, filename || reportType);
      if (result.success) {
        console.log('PDF exported successfully');
      } else {
        console.error('Failed to export PDF:', result.error);
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = () => {
    setExporting('excel');
    try {
      let formattedData = data;
      
      if (formatDataForExport[reportType]) {
        formattedData = formatDataForExport[reportType](data);
      }
      
      const result = exportToExcel(formattedData, filename || reportType, `${reportType} Report`);
      if (result.success) {
        console.log('Excel exported successfully');
      } else {
        console.error('Failed to export Excel:', result.error);
      }
    } catch (error) {
      console.error('Error exporting Excel:', error);
    } finally {
      setExporting(null);
    }
  };

  const handleExportCSV = () => {
    setExporting('csv');
    try {
      let formattedData = data;
      
      if (formatDataForExport[reportType]) {
        formattedData = formatDataForExport[reportType](data);
      }
      
      const result = exportToCSV(formattedData, filename || reportType);
      if (result.success) {
        console.log('CSV exported successfully');
      } else {
        console.error('Failed to export CSV:', result.error);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="text-sm font-medium text-gray-700">{t('reports.exportReport')}:</div>
      
      <button
        onClick={handleExportPDF}
        disabled={exporting === 'pdf'}
        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500 disabled:opacity-50"
      >
        <DocumentArrowDownIcon className="h-4 w-4 mr-1.5" />
        {exporting === 'pdf' ? t('common.loading') : 'PDF'}
      </button>
      
      <button
        onClick={handleExportExcel}
        disabled={exporting === 'excel'}
        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500 disabled:opacity-50"
      >
        <TableCellsIcon className="h-4 w-4 mr-1.5" />
        {exporting === 'excel' ? t('common.loading') : 'Excel'}
      </button>
      
      <button
        onClick={handleExportCSV}
        disabled={exporting === 'csv'}
        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500 disabled:opacity-50"
      >
        <DocumentTextIcon className="h-4 w-4 mr-1.5" />
        {exporting === 'csv' ? t('common.loading') : 'CSV'}
      </button>
    </div>
  );
};

export default ExportOptions;