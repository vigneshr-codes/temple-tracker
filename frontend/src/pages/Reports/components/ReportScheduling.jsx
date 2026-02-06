import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  XMarkIcon, 
  ClockIcon, 
  CalendarIcon,
  EnvelopeIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

const ReportScheduling = ({ isOpen, onClose, reportType, currentFilters }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    reportType: reportType || 'financial-summary',
    frequency: 'weekly',
    dayOfWeek: 1, // Monday
    dayOfMonth: 1,
    time: '09:00',
    recipients: [''],
    format: 'pdf',
    active: true,
    filters: currentFilters || {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scheduledReports, setScheduledReports] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchScheduledReports();
    }
  }, [isOpen]);

  const fetchScheduledReports = async () => {
    try {
      const token = localStorage.getItem('temple_token');
      const response = await fetch('/api/reports/scheduled', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (result.success) {
        setScheduledReports(result.data);
      }
    } catch (err) {
      console.error('Error fetching scheduled reports:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRecipientsChange = (index, value) => {
    const newRecipients = [...formData.recipients];
    newRecipients[index] = value;
    setFormData(prev => ({
      ...prev,
      recipients: newRecipients
    }));
  };

  const addRecipient = () => {
    setFormData(prev => ({
      ...prev,
      recipients: [...prev.recipients, '']
    }));
  };

  const removeRecipient = (index) => {
    const newRecipients = formData.recipients.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      recipients: newRecipients
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('temple_token');
      const response = await fetch('/api/reports/schedule', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          recipients: formData.recipients.filter(email => email.trim() !== '')
        })
      });

      const result = await response.json();
      if (result.success) {
        await fetchScheduledReports();
        setFormData({
          name: '',
          reportType: reportType || 'financial-summary',
          frequency: 'weekly',
          dayOfWeek: 1,
          dayOfMonth: 1,
          time: '09:00',
          recipients: [''],
          format: 'pdf',
          active: true,
          filters: currentFilters || {}
        });
      } else {
        setError(result.message || 'Failed to schedule report');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteScheduledReport = async (id) => {
    try {
      const token = localStorage.getItem('temple_token');
      const response = await fetch(`/api/reports/scheduled/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.success) {
        await fetchScheduledReports();
      }
    } catch (err) {
      console.error('Error deleting scheduled report:', err);
    }
  };

  const toggleScheduledReport = async (id, active) => {
    try {
      const token = localStorage.getItem('temple_token');
      const response = await fetch(`/api/reports/scheduled/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active })
      });

      const result = await response.json();
      if (result.success) {
        await fetchScheduledReports();
      }
    } catch (err) {
      console.error('Error updating scheduled report:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ClockIcon className="h-6 w-6 text-temple-600 mr-3" />
              <h2 className="text-lg font-medium text-gray-900">
                {t('reports.scheduleReports')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Schedule Form */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {t('reports.createSchedule')}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Schedule Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('reports.scheduleName')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-temple-500"
                  placeholder={t('reports.scheduleNamePlaceholder')}
                  required
                />
              </div>

              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('reports.reportType')}
                </label>
                <select
                  value={formData.reportType}
                  onChange={(e) => handleInputChange('reportType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-temple-500"
                >
                  <option value="financial-summary">{t('reports.financialSummary')}</option>
                  <option value="donation-report">{t('reports.donationReport')}</option>
                  <option value="expense-report">{t('reports.expenseReport')}</option>
                  <option value="balance-sheet">{t('reports.balanceSheet')}</option>
                  <option value="inventory-report">{t('reports.inventoryReport')}</option>
                  <option value="donor-report">{t('reports.donorReport')}</option>
                </select>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('reports.frequency')}
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => handleInputChange('frequency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-temple-500"
                >
                  <option value="daily">{t('common.daily')}</option>
                  <option value="weekly">{t('common.weekly')}</option>
                  <option value="monthly">{t('common.monthly')}</option>
                  <option value="quarterly">{t('common.quarterly')}</option>
                </select>
              </div>

              {/* Day Selection */}
              {formData.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('reports.dayOfWeek')}
                  </label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => handleInputChange('dayOfWeek', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-temple-500"
                  >
                    <option value={1}>{t('calendar.monday')}</option>
                    <option value={2}>{t('calendar.tuesday')}</option>
                    <option value={3}>{t('calendar.wednesday')}</option>
                    <option value={4}>{t('calendar.thursday')}</option>
                    <option value={5}>{t('calendar.friday')}</option>
                    <option value={6}>{t('calendar.saturday')}</option>
                    <option value={0}>{t('calendar.sunday')}</option>
                  </select>
                </div>
              )}

              {formData.frequency === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('reports.dayOfMonth')}
                  </label>
                  <select
                    value={formData.dayOfMonth}
                    onChange={(e) => handleInputChange('dayOfMonth', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-temple-500"
                  >
                    {Array.from({ length: 28 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('reports.deliveryTime')}
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-temple-500"
                />
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('reports.format')}
                </label>
                <select
                  value={formData.format}
                  onChange={(e) => handleInputChange('format', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-temple-500"
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                </select>
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('reports.emailRecipients')}
                </label>
                {formData.recipients.map((email, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => handleRecipientsChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-temple-500"
                      placeholder="email@example.com"
                    />
                    {formData.recipients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRecipient(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addRecipient}
                  className="text-temple-600 text-sm hover:text-temple-800"
                >
                  + {t('reports.addRecipient')}
                </button>
              </div>

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-temple-600 text-white py-2 px-4 rounded-md hover:bg-temple-700 focus:outline-none focus:ring-2 focus:ring-temple-500 disabled:opacity-50"
              >
                {loading ? t('common.loading') : t('reports.scheduleReport')}
              </button>
            </form>
          </div>

          {/* Existing Schedules */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {t('reports.existingSchedules')}
            </h3>

            <div className="space-y-3">
              {scheduledReports.map((schedule) => (
                <div
                  key={schedule._id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{schedule.name}</h4>
                      <p className="text-sm text-gray-500">
                        {t(`reports.${schedule.reportType.replace('-', '')}`)} • {t(`common.${schedule.frequency}`)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {schedule.recipients.join(', ')}
                      </p>
                      <div className="flex items-center mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          schedule.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {schedule.active ? t('status.active') : t('status.inactive')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleScheduledReport(schedule._id, !schedule.active)}
                        className="text-temple-600 hover:text-temple-800 text-sm"
                      >
                        {schedule.active ? t('actions.pause') : t('actions.resume')}
                      </button>
                      <button
                        onClick={() => deleteScheduledReport(schedule._id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        {t('actions.delete')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {scheduledReports.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>{t('reports.noScheduledReports')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportScheduling;