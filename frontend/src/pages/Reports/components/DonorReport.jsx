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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  UsersIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import ExportOptions from './ExportOptions';
import authService from '../../../services/authService';

const DonorReport = ({ filters }) => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDonorData();
  }, [filters]);

  const fetchDonorData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        period: filters.period || 'month',
        category: filters.category || 'all',
        type: filters.type || 'all'
      });
      
      if (filters.startDate) queryParams.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) queryParams.append('endDate', filters.endDate.toISOString());
      
      const { data: result } = await authService.api.get(`/reports/donors?${queryParams}`);
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

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444'];

  const getDonorTypeColor = (type) => {
    switch (type) {
      case 'regular': return 'text-green-600 bg-green-100';
      case 'occasional': return 'text-blue-600 bg-blue-100';
      case 'new': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

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

  return (
    <div className="p-6">
      {/* Export Options */}
      <div className="mb-6 flex justify-end">
        <ExportOptions 
          reportType="donors"
          data={data}
          elementId="donor-report"
          filename="donor-report"
        />
      </div>

      {/* Report Content */}
      <div id="donor-report">
        {/* Report Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">{t('reports.donorReport')}</h1>
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
              <UsersIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{t('reports.totalDonors')}</p>
              <p className="text-2xl font-bold text-gray-900">{data?.totalDonors || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{t('reports.totalContributions')}</p>
              <p className="text-2xl font-bold text-gray-900">₹{data?.totalContributions?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarDaysIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{t('reports.activeDonors')}</p>
              <p className="text-2xl font-bold text-gray-900">{data?.activeDonors || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <StarIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{t('reports.avgDonation')}</p>
              <p className="text-2xl font-bold text-gray-900">₹{data?.avgDonation?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Donor Growth Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('reports.donorGrowthTrend')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data?.growthData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="newDonors" 
                stroke="#10B981" 
                strokeWidth={2}
                name={t('reports.newDonors')}
              />
              <Line 
                type="monotone" 
                dataKey="totalDonors" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name={t('reports.totalDonors')}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Donor Type Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('reports.donorTypeDistribution')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data?.typeData || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {(data?.typeData || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Donation Frequency */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('reports.donationFrequency')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.frequencyData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="frequency" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donation Amount Ranges */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('reports.donationAmountRanges')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.amountRangeData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Donors Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('reports.topDonors')}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.rank')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.donor')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('reports.totalDonated')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('reports.donationCount')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('reports.avgDonation')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('reports.firstDonation')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('reports.lastDonation')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.type')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(data?.topDonors || []).map((donor, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center">
                      <span className="flex-shrink-0 w-8 h-8 bg-temple-100 rounded-full flex items-center justify-center">
                        <span className="text-temple-600 font-medium text-sm">{index + 1}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{donor.name}</div>
                    <div className="text-sm text-gray-500">{donor.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{(donor.totalDonated || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {donor.donationCount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{((donor.totalDonated || 0) / (donor.donationCount || 1)).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(donor.firstDonation).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(donor.lastDonation).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDonorTypeColor(donor.type || 'regular')}`}>
                      {t(`donors.${donor.type || 'regular'}`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Donor Engagement Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent New Donors */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('reports.recentNewDonors')}</h3>
          <div className="space-y-4">
            {(data?.recentNewDonors || []).map((donor, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <UsersIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">{donor.name}</p>
                    <p className="text-xs text-gray-500">{donor.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">₹{(donor.firstDonationAmount || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{new Date(donor.joinDate).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inactive Donors */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('reports.inactiveDonors')}</h3>
          <div className="space-y-4">
            {(data?.inactiveDonors || []).map((donor, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <CalendarDaysIcon className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">{donor.name}</p>
                    <p className="text-xs text-gray-500">
                      {t('reports.totalDonated')}: ₹{(donor.totalDonated || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {Math.floor((new Date() - new Date(donor.lastDonation)) / (1000 * 60 * 60 * 24))} {t('reports.daysAgo')}
                  </p>
                  <p className="text-xs text-gray-500">{new Date(donor.lastDonation).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default DonorReport;
