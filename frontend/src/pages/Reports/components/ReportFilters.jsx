import React from 'react';
import { useTranslation } from 'react-i18next';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ReportFilters = ({ filters, onChange, reportType }) => {
  const { t } = useTranslation();

  const handleDateChange = (field, value) => {
    onChange({ [field]: value });
  };

  const handleSelectChange = (field, value) => {
    onChange({ [field]: value });
  };

  const periodOptions = [
    { value: 'day', label: t('common.daily') },
    { value: 'week', label: t('common.weekly') },
    { value: 'month', label: t('common.monthly') },
    { value: 'quarter', label: t('common.quarterly') },
    { value: 'year', label: t('common.yearly') },
    { value: 'custom', label: t('common.custom') }
  ];

  const categoryOptions = {
    donations: [
      { value: 'all', label: t('common.all') },
      { value: 'general', label: t('donations.general') },
      { value: 'pooja-offerings', label: t('donations.poojaOfferings') },
      { value: 'special-offerings', label: t('donations.specialOfferings') },
      { value: 'festival-donations', label: t('donations.festivalDonations') },
      { value: 'anadhanam-donations', label: t('donations.anadhanamDonations') }
    ],
    expenses: [
      { value: 'all', label: t('common.all') },
      { value: 'cooking-gas-fuel', label: t('expenses.cookingGasFuel') },
      { value: 'labor-charges', label: t('expenses.laborCharges') },
      { value: 'electricity-bill', label: t('expenses.electricityBill') },
      { value: 'maintenance', label: t('expenses.maintenance') },
      { value: 'festival-expenses', label: t('expenses.festivalExpenses') },
      { value: 'anadhanam-supplies', label: t('expenses.anadhanamSupplies') }
    ],
    inventory: [
      { value: 'all', label: t('common.all') },
      { value: 'pooja-items', label: t('inventory.poojaItems') },
      { value: 'kitchen-supplies', label: t('inventory.kitchenSupplies') },
      { value: 'cleaning-supplies', label: t('inventory.cleaningSupplies') },
      { value: 'office-supplies', label: t('inventory.officeSupplies') }
    ],
    donors: [
      { value: 'all', label: t('common.all') },
      { value: 'regular', label: t('donors.regular') },
      { value: 'occasional', label: t('donors.occasional') },
      { value: 'new', label: t('donors.new') }
    ]
  };

  const typeOptions = {
    donations: [
      { value: 'all', label: t('common.all') },
      { value: 'cash', label: t('common.cash') },
      { value: 'upi', label: t('common.upi') },
      { value: 'bank-transfer', label: t('common.bankTransfer') },
      { value: 'cheque', label: t('common.cheque') }
    ],
    expenses: [
      { value: 'all', label: t('common.all') },
      { value: 'pending', label: t('status.pending') },
      { value: 'paid', label: t('status.paid') },
      { value: 'approved', label: t('status.approved') },
      { value: 'rejected', label: t('status.rejected') }
    ],
    inventory: [
      { value: 'all', label: t('common.all') },
      { value: 'in-stock', label: t('inventory.inStock') },
      { value: 'low-stock', label: t('inventory.lowStock') },
      { value: 'out-of-stock', label: t('inventory.outOfStock') }
    ]
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Period Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('reports.period')}
        </label>
        <select
          value={filters.period}
          onChange={(e) => handleSelectChange('period', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-temple-500 focus:border-temple-500"
        >
          {periodOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Start Date */}
      {filters.period === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('common.startDate')}
          </label>
          <DatePicker
            selected={filters.startDate}
            onChange={(date) => handleDateChange('startDate', date)}
            selectsStart
            startDate={filters.startDate}
            endDate={filters.endDate}
            placeholderText={t('common.selectStartDate')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-temple-500 focus:border-temple-500"
            dateFormat="dd/MM/yyyy"
          />
        </div>
      )}

      {/* End Date */}
      {filters.period === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('common.endDate')}
          </label>
          <DatePicker
            selected={filters.endDate}
            onChange={(date) => handleDateChange('endDate', date)}
            selectsEnd
            startDate={filters.startDate}
            endDate={filters.endDate}
            minDate={filters.startDate}
            placeholderText={t('common.selectEndDate')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-temple-500 focus:border-temple-500"
            dateFormat="dd/MM/yyyy"
          />
        </div>
      )}

      {/* Category Filter */}
      {categoryOptions[reportType] && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('common.category')}
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleSelectChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-temple-500 focus:border-temple-500"
          >
            {categoryOptions[reportType].map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Type Filter */}
      {typeOptions[reportType] && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('common.type')}
          </label>
          <select
            value={filters.type}
            onChange={(e) => handleSelectChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-temple-500 focus:border-temple-500"
          >
            {typeOptions[reportType].map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default ReportFilters;