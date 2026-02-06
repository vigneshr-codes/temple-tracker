import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { 
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UsersIcon,
  ClockIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { canAccessModule, hasPermission } from '../../utils/permissions';
import ReportFilters from './components/ReportFilters';
import FinancialSummary from './components/FinancialSummary';
import DonationReport from './components/DonationReport';
import ExpenseReport from './components/ExpenseReport';
import InventoryReport from './components/InventoryReport';
import DonorReport from './components/DonorReport';
import BalanceSheet from './components/BalanceSheet';
import ReportScheduling from './components/ReportScheduling';

const Reports = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const [activeReport, setActiveReport] = useState('financial-summary');
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    period: 'month',
    category: 'all',
    type: 'all'
  });
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);

  // Check if user has access to the reports module
  if (!canAccessModule(user, 'reports')) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {t('common.accessDenied')}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t('reports.noPermission')}
          </p>
        </div>
      </div>
    );
  }

  const reportTypes = [
    {
      id: 'financial-summary',
      name: t('reports.financialSummary'),
      description: t('reports.financialSummaryDesc'),
      icon: ChartBarIcon,
      color: 'bg-blue-500'
    },
    {
      id: 'donations',
      name: t('reports.donationReport'),
      description: t('reports.donationReportDesc'),
      icon: CurrencyDollarIcon,
      color: 'bg-green-500'
    },
    {
      id: 'expenses',
      name: t('reports.expenseReport'),
      description: t('reports.expenseReportDesc'),
      icon: DocumentArrowDownIcon,
      color: 'bg-red-500'
    },
    {
      id: 'balance',
      name: t('reports.balanceSheet'),
      description: t('reports.balanceSheetDesc'),
      icon: CalendarIcon,
      color: 'bg-purple-500'
    },
    {
      id: 'inventory',
      name: t('reports.inventoryReport'),
      description: t('reports.inventoryReportDesc'),
      icon: ShoppingBagIcon,
      color: 'bg-orange-500'
    },
    {
      id: 'donors',
      name: t('reports.donorReport'),
      description: t('reports.donorReportDesc'),
      icon: UsersIcon,
      color: 'bg-indigo-500'
    }
  ];

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const renderActiveReport = () => {
    switch (activeReport) {
      case 'financial-summary':
        return <FinancialSummary filters={filters} />;
      case 'donations':
        return <DonationReport filters={filters} />;
      case 'expenses':
        return <ExpenseReport filters={filters} />;
      case 'balance':
        return <BalanceSheet filters={filters} />;
      case 'inventory':
        return <InventoryReport filters={filters} />;
      case 'donors':
        return <DonorReport filters={filters} />;
      default:
        return <FinancialSummary filters={filters} />;
    }
  };

  const getCurrentReport = () => {
    return reportTypes.find(report => report.id === activeReport) || reportTypes[0];
  };

  const currentReport = getCurrentReport();
  const Icon = currentReport.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Report Info */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center mb-4 sm:mb-0">
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${currentReport.color} mr-4`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {currentReport.name}
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    {currentReport.description}
                  </p>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center space-x-3">
                {hasPermission(user, 'reports', 'export') && (
                  <button
                    onClick={() => setShowSchedulingModal(true)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    {t('reports.schedule')}
                  </button>
                )}
                {hasPermission(user, 'reports', 'export') && (
                  <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-temple-600 hover:bg-temple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500">
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    {t('actions.export')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-t border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
              {reportTypes.map((report) => {
                const ReportIcon = report.icon;
                const isActive = activeReport === report.id;
                
                return (
                  <button
                    key={report.id}
                    onClick={() => setActiveReport(report.id)}
                    className={`flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? 'border-temple-500 text-temple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <ReportIcon className="h-4 w-4 mr-2" />
                    {report.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">
                {t('actions.filter')}
              </h2>
            </div>
          </div>
          <div className="p-6">
            <ReportFilters
              filters={filters}
              onChange={handleFilterChange}
              reportType={activeReport}
            />
          </div>
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-lg shadow">
          {renderActiveReport()}
        </div>
      </div>

      {/* Report Scheduling Modal */}
      <ReportScheduling
        isOpen={showSchedulingModal}
        onClose={() => setShowSchedulingModal(false)}
        reportType={activeReport}
        currentFilters={filters}
      />
    </div>
  );
};

export default Reports;