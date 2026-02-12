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
  ScaleIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import ExportOptions from './ExportOptions';
import authService from '../../../services/authService';

const BalanceSheet = ({ filters }) => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBalanceData();
  }, [filters]);

  const fetchBalanceData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        period: filters.period || 'month'
      });
      
      if (filters.startDate) queryParams.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) queryParams.append('endDate', filters.endDate.toISOString());
      
      const { data: result } = await authService.api.get(`/reports/balance?${queryParams}`);
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

  const COLORS = ['#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#8B5CF6'];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
            ))}
          </div>
          <div className="bg-gray-200 rounded-lg h-96 mb-6"></div>
          <div className="bg-gray-200 rounded-lg h-64"></div>
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

  const netBalance = (data?.totalAssets || 0) - (data?.totalLiabilities || 0);
  const isPositive = netBalance >= 0;

  return (
    <div className="p-6">
      {/* Export Options */}
      <div className="mb-6 flex justify-end">
        <ExportOptions 
          reportType="balance"
          data={data}
          elementId="balance-sheet-report"
          filename="balance-sheet"
        />
      </div>

      {/* Report Content */}
      <div id="balance-sheet-report">
        {/* Report Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">{t('reports.balanceSheet')}</h1>
          <p className="text-gray-600">
            {filters.startDate && filters.endDate 
              ? `${filters.startDate.toLocaleDateString()} - ${filters.endDate.toLocaleDateString()}`
              : t(`common.${filters.period}`)
            }
          </p>
        </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{t('reports.totalAssets')}</p>
              <p className="text-2xl font-bold text-gray-900">₹{data?.totalAssets?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowTrendingDownIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{t('reports.totalLiabilities')}</p>
              <p className="text-2xl font-bold text-gray-900">₹{data?.totalLiabilities?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ScaleIcon className={`h-8 w-8 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{t('reports.netWorth')}</p>
              <p className={`text-2xl font-bold ${isPositive ? 'text-green-900' : 'text-red-900'}`}>
                ₹{Math.abs(netBalance).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {isPositive ? t('reports.surplus') : t('reports.deficit')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BanknotesIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{t('reports.cashOnHand')}</p>
              <p className="text-2xl font-bold text-gray-900">₹{data?.cashOnHand?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Sheet Statement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Assets */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ArrowTrendingUpIcon className="h-5 w-5 text-green-600 mr-2" />
            {t('reports.assets')}
          </h3>
          <div className="space-y-4">
            {/* Current Assets */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-2">{t('reports.currentAssets')}</h4>
              <div className="space-y-2 ml-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">{t('reports.cash')}</span>
                  <span className="text-sm font-medium">₹{data?.assets?.cash?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">{t('reports.bankBalance')}</span>
                  <span className="text-sm font-medium">₹{data?.assets?.bankBalance?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">{t('reports.inventory')}</span>
                  <span className="text-sm font-medium">₹{data?.assets?.inventory?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 font-medium">
                  <span className="text-sm">{t('reports.totalCurrentAssets')}</span>
                  <span className="text-sm">₹{data?.assets?.totalCurrent?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>

            {/* Fixed Assets */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-2">{t('reports.fixedAssets')}</h4>
              <div className="space-y-2 ml-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">{t('reports.templeBuilding')}</span>
                  <span className="text-sm font-medium">₹{data?.assets?.building?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">{t('reports.equipment')}</span>
                  <span className="text-sm font-medium">₹{data?.assets?.equipment?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">{t('reports.vehicles')}</span>
                  <span className="text-sm font-medium">₹{data?.assets?.vehicles?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 font-medium">
                  <span className="text-sm">{t('reports.totalFixedAssets')}</span>
                  <span className="text-sm">₹{data?.assets?.totalFixed?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center py-3 border-t-2 border-green-200 bg-green-50 rounded font-bold text-green-800">
              <span>{t('reports.totalAssets')}</span>
              <span>₹{data?.totalAssets?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>

        {/* Liabilities */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ArrowTrendingDownIcon className="h-5 w-5 text-red-600 mr-2" />
            {t('reports.liabilities')}
          </h3>
          <div className="space-y-4">
            {/* Current Liabilities */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-2">{t('reports.currentLiabilities')}</h4>
              <div className="space-y-2 ml-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">{t('reports.accountsPayable')}</span>
                  <span className="text-sm font-medium">₹{data?.liabilities?.accountsPayable?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">{t('reports.pendingExpenses')}</span>
                  <span className="text-sm font-medium">₹{data?.liabilities?.pendingExpenses?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">{t('reports.accruals')}</span>
                  <span className="text-sm font-medium">₹{data?.liabilities?.accruals?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 font-medium">
                  <span className="text-sm">{t('reports.totalCurrentLiabilities')}</span>
                  <span className="text-sm">₹{data?.liabilities?.totalCurrent?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>

            {/* Long-term Liabilities */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-2">{t('reports.longTermLiabilities')}</h4>
              <div className="space-y-2 ml-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">{t('reports.loans')}</span>
                  <span className="text-sm font-medium">₹{data?.liabilities?.loans?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">{t('reports.mortgages')}</span>
                  <span className="text-sm font-medium">₹{data?.liabilities?.mortgages?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 font-medium">
                  <span className="text-sm">{t('reports.totalLongTermLiabilities')}</span>
                  <span className="text-sm">₹{data?.liabilities?.totalLongTerm?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center py-3 border-t-2 border-red-200 bg-red-50 rounded font-bold text-red-800">
              <span>{t('reports.totalLiabilities')}</span>
              <span>₹{data?.totalLiabilities?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Assets vs Liabilities Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('reports.balanceTrend')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data?.trendData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="assets" 
                stroke="#10B981" 
                strokeWidth={2}
                name={t('reports.assets')}
              />
              <Line 
                type="monotone" 
                dataKey="liabilities" 
                stroke="#EF4444" 
                strokeWidth={2}
                name={t('reports.liabilities')}
              />
              <Line 
                type="monotone" 
                dataKey="netWorth" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name={t('reports.netWorth')}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Composition */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('reports.assetComposition')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data?.assetComposition || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(data?.assetComposition || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Net Worth Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <ScaleIcon className="h-5 w-5 text-blue-600 mr-2" />
          {t('reports.netWorthSummary')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">{t('reports.currentNetWorth')}</p>
            <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              ₹{Math.abs(netBalance).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {isPositive ? t('reports.surplus') : t('reports.deficit')}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">{t('reports.assetGrowth')}</p>
            <p className="text-2xl font-bold text-green-600">
              {data?.growth?.assets > 0 ? '+' : ''}{data?.growth?.assets || 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">{t('reports.fromLastPeriod')}</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">{t('reports.debtRatio')}</p>
            <p className="text-2xl font-bold text-yellow-600">
              {((data?.totalLiabilities || 0) / (data?.totalAssets || 1) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">{t('reports.liabilitiesToAssets')}</p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default BalanceSheet;
