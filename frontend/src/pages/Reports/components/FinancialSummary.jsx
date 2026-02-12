import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  CurrencyDollarIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  ScaleIcon
} from '@heroicons/react/24/outline';
import ExportOptions from './ExportOptions';
import authService from '../../../services/authService';

const FinancialSummary = ({ filters }) => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFinancialData();
  }, [filters]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        period: filters.period || 'month'
      });
      
      if (filters.startDate) queryParams.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) queryParams.append('endDate', filters.endDate.toISOString());
      
      const { data: result } = await authService.api.get(`/reports/dashboard?${queryParams}`);
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#8B5CF6'];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
          <div className="bg-gray-200 rounded-lg h-96"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-red-500 text-lg mb-2">{t('common.error')}</div>
          <div className="text-gray-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Export Options */}
      <div className="mb-6 flex justify-end">
        <ExportOptions 
          reportType="financial"
          data={data}
          elementId="financial-summary-report"
          filename="financial-summary"
        />
      </div>

      {/* Report Content */}
      <div id="financial-summary-report">
        {/* Report Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">{t('reports.financialSummary')}</h1>
          <p className="text-gray-600">
            {filters.startDate && filters.endDate 
              ? `${filters.startDate.toLocaleDateString()} - ${filters.endDate.toLocaleDateString()}`
              : t(`common.${filters.period}`)
            }
          </p>
        </div>

        {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Income */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowUpIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <p className="text-green-100 text-sm font-medium">{t('reports.totalIncome')}</p>
              <p className="text-2xl font-bold">₹{data?.totalIncome?.toLocaleString() || 0}</p>
              {data?.incomeChange && (
                <p className="text-green-100 text-xs">
                  {data.incomeChange > 0 ? '+' : ''}{data.incomeChange}% {t('reports.fromLastPeriod')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowDownIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <p className="text-red-100 text-sm font-medium">{t('reports.totalExpenses')}</p>
              <p className="text-2xl font-bold">₹{data?.totalExpenses?.toLocaleString() || 0}</p>
              {data?.expenseChange && (
                <p className="text-red-100 text-xs">
                  {data.expenseChange > 0 ? '+' : ''}{data.expenseChange}% {t('reports.fromLastPeriod')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Net Balance */}
        <div className={`bg-gradient-to-r ${(data?.totalIncome - data?.totalExpenses) >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} rounded-lg p-6 text-white`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ScaleIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <p className="text-blue-100 text-sm font-medium">{t('reports.netBalance')}</p>
              <p className="text-2xl font-bold">₹{((data?.totalIncome || 0) - (data?.totalExpenses || 0)).toLocaleString()}</p>
              <p className="text-blue-100 text-xs">
                {(data?.totalIncome - data?.totalExpenses) >= 0 ? t('reports.surplus') : t('reports.deficit')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Income vs Expenses Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('reports.incomeVsExpensesTrend')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data?.trendData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#10B981" 
                strokeWidth={2}
                name={t('reports.income')}
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#EF4444" 
                strokeWidth={2}
                name={t('reports.expenses')}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('reports.categoryBreakdown')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data?.categoryData || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(data?.categoryData || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Comparison */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('reports.monthlyComparison')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.monthlyData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="income" fill="#10B981" name={t('reports.income')} />
              <Bar dataKey="expenses" fill="#EF4444" name={t('reports.expenses')} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Donors */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('reports.topDonors')}</h3>
          <div className="space-y-3">
            {(data?.topDonors || []).map((donor, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 bg-temple-100 rounded-full flex items-center justify-center">
                    <span className="text-temple-600 font-medium text-sm">{index + 1}</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{donor.name}</p>
                    <p className="text-xs text-gray-500">{donor.donationCount} {t('reports.donations')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">₹{donor.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('reports.financialMetrics')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{data?.metrics?.avgDonation || 0}</p>
            <p className="text-sm text-gray-500">{t('reports.avgDonation')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{data?.metrics?.totalDonors || 0}</p>
            <p className="text-sm text-gray-500">{t('reports.totalDonors')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{data?.metrics?.avgExpense || 0}</p>
            <p className="text-sm text-gray-500">{t('reports.avgExpense')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{data?.metrics?.expenseCategories || 0}</p>
            <p className="text-sm text-gray-500">{t('reports.expenseCategories')}</p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default FinancialSummary;
