import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addNotification } from '../../features/ui/uiSlice';
import { hasPermission } from '../../utils/permissions';
import {
  CogIcon,
  BuildingLibraryIcon,
  BellIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ArchiveBoxIcon,
  CalendarDaysIcon,
  LinkIcon,
  DocumentArrowDownIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Settings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Settings is admin-only
  if (user?.role !== 'admin') {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            Only administrators can access settings.
          </p>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState('temple');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);

  const tabs = [
    { id: 'temple', name: 'Temple Config', icon: BuildingLibraryIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'system', name: 'System Preferences', icon: CogIcon },
    { id: 'financial', name: 'Financial', icon: CurrencyDollarIcon },
    { id: 'inventory', name: 'Inventory', icon: ArchiveBoxIcon },
    { id: 'events', name: 'Events', icon: CalendarDaysIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'integrations', name: 'Integrations', icon: LinkIcon },
    { id: 'backup', name: 'Backup & System', icon: CloudArrowUpIcon }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('temple_token');
      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
      } else {
        dispatch(addNotification({
          type: 'error',
          message: data.message || 'Failed to fetch settings'
        }));
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to fetch settings'
      }));
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (section, data) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('temple_token');
      const response = await fetch(`/api/settings/${section}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (result.success) {
        setSettings(result.data);
        dispatch(addNotification({
          type: 'success',
          message: result.message || 'Settings updated successfully'
        }));
      } else {
        dispatch(addNotification({
          type: 'error',
          message: result.message || 'Failed to update settings'
        }));
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to update settings'
      }));
    } finally {
      setSaving(false);
    }
  };

  const testNotification = async (type, recipient) => {
    try {
      setTestingNotification(true);
      const token = localStorage.getItem('temple_token');
      const response = await fetch('/api/settings/test-notification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, recipient })
      });

      const result = await response.json();
      if (result.success) {
        dispatch(addNotification({
          type: 'success',
          message: result.message
        }));
      } else {
        dispatch(addNotification({
          type: 'error',
          message: result.message || 'Test notification failed'
        }));
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to send test notification'
      }));
    } finally {
      setTestingNotification(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-temple-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-700">
            Configure temple management system preferences and integrations
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => fetchSettings()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-temple-600 to-saffron-500 hover:from-temple-700 hover:to-saffron-600 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Refresh Settings
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mt-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-temple-500 text-temple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'temple' && (
          <TempleConfigTab 
            settings={settings} 
            updateSettings={updateSettings}
            saving={saving}
          />
        )}
        {activeTab === 'notifications' && (
          <NotificationsTab 
            settings={settings} 
            updateSettings={updateSettings}
            testNotification={testNotification}
            saving={saving}
            testing={testingNotification}
          />
        )}
        {activeTab === 'system' && (
          <SystemPreferencesTab 
            settings={settings} 
            updateSettings={updateSettings}
            saving={saving}
          />
        )}
        {activeTab === 'financial' && (
          <FinancialTab 
            settings={settings} 
            updateSettings={updateSettings}
            saving={saving}
          />
        )}
        {activeTab === 'inventory' && (
          <InventoryTab 
            settings={settings} 
            updateSettings={updateSettings}
            saving={saving}
          />
        )}
        {activeTab === 'events' && (
          <EventsTab 
            settings={settings} 
            updateSettings={updateSettings}
            saving={saving}
          />
        )}
        {activeTab === 'security' && (
          <SecurityTab 
            settings={settings} 
            updateSettings={updateSettings}
            saving={saving}
          />
        )}
        {activeTab === 'integrations' && (
          <IntegrationsTab 
            settings={settings} 
            updateSettings={updateSettings}
            saving={saving}
          />
        )}
        {activeTab === 'backup' && (
          <BackupTab 
            settings={settings} 
            updateSettings={updateSettings}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
};

// Placeholder components for each tab - will be implemented next
const TempleConfigTab = ({ settings, updateSettings, saving }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    contact: {
      phone: '',
      email: '',
      website: ''
    },
    registrationNumber: '',
    establishedYear: ''
  });

  useEffect(() => {
    if (settings?.templeConfig) {
      setFormData({
        name: settings.templeConfig.name || '',
        address: {
          street: settings.templeConfig.address?.street || '',
          city: settings.templeConfig.address?.city || '',
          state: settings.templeConfig.address?.state || '',
          pincode: settings.templeConfig.address?.pincode || '',
          country: settings.templeConfig.address?.country || 'India'
        },
        contact: {
          phone: settings.templeConfig.contact?.phone || '',
          email: settings.templeConfig.contact?.email || '',
          website: settings.templeConfig.contact?.website || ''
        },
        registrationNumber: settings.templeConfig.registrationNumber || '',
        establishedYear: settings.templeConfig.establishedYear || ''
      });
    }
  }, [settings]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateSettings('templeConfig', formData);
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Temple Configuration</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure basic temple information and contact details
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
        {/* Temple Basic Information */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="templeName" className="block text-sm font-medium text-gray-700">
                Temple Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="templeName"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700">
                Registration Number
              </label>
              <input
                type="text"
                id="registrationNumber"
                value={formData.registrationNumber}
                onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
              />
            </div>
            
            <div>
              <label htmlFor="establishedYear" className="block text-sm font-medium text-gray-700">
                Established Year
              </label>
              <input
                type="number"
                id="establishedYear"
                value={formData.establishedYear}
                onChange={(e) => handleInputChange('establishedYear', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                min="1800"
                max={new Date().getFullYear()}
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Address Information</h4>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                Street Address
              </label>
              <input
                type="text"
                id="street"
                value={formData.address.street}
                onChange={(e) => handleInputChange('address.street', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
              />
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                />
              </div>
              
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  type="text"
                  id="state"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange('address.state', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                />
              </div>
              
              <div>
                <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                  Pincode
                </label>
                <input
                  type="text"
                  id="pincode"
                  value={formData.address.pincode}
                  onChange={(e) => handleInputChange('address.pincode', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                  pattern="[0-9]{6}"
                />
              </div>
            </div>
            
            <div className="sm:grid-cols-2">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <select
                  id="country"
                  value={formData.address.country}
                  onChange={(e) => handleInputChange('address.country', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                >
                  <option value="India">India</option>
                  <option value="USA">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Contact Information</h4>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.contact.phone}
                onChange={(e) => handleInputChange('contact.phone', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.contact.email}
                onChange={(e) => handleInputChange('contact.email', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
              />
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                Website URL
              </label>
              <input
                type="url"
                id="website"
                value={formData.contact.website}
                onChange={(e) => handleInputChange('contact.website', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-temple-600 to-saffron-500 hover:from-temple-700 hover:to-saffron-600 transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  Saving...
                </>
              ) : (
                'Save Configuration'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

const NotificationsTab = ({ settings, updateSettings, testNotification, saving, testing }) => {
  const [formData, setFormData] = useState({
    enableWhatsApp: false,
    enableSMS: false,
    enableEmail: false,
    whatsAppConfig: {
      apiKey: '',
      phoneNumberId: '',
      businessAccountId: ''
    },
    smsConfig: {
      provider: 'twilio',
      apiKey: '',
      senderId: ''
    },
    emailConfig: {
      host: '',
      port: 587,
      username: '',
      password: '',
      fromEmail: '',
      fromName: ''
    },
    templates: {
      donationThankYou: {
        whatsapp: '',
        sms: '',
        email: ''
      },
      inventoryUsage: {
        whatsapp: '',
        sms: ''
      },
      eventReminder: {
        whatsapp: '',
        sms: ''
      }
    }
  });

  const [testData, setTestData] = useState({
    type: 'whatsapp',
    recipient: ''
  });

  useEffect(() => {
    if (settings?.notifications) {
      setFormData({
        enableWhatsApp: settings.notifications.enableWhatsApp || false,
        enableSMS: settings.notifications.enableSMS || false,
        enableEmail: settings.notifications.enableEmail || false,
        whatsAppConfig: {
          apiKey: settings.notifications.whatsAppConfig?.apiKey || '',
          phoneNumberId: settings.notifications.whatsAppConfig?.phoneNumberId || '',
          businessAccountId: settings.notifications.whatsAppConfig?.businessAccountId || ''
        },
        smsConfig: {
          provider: settings.notifications.smsConfig?.provider || 'twilio',
          apiKey: settings.notifications.smsConfig?.apiKey || '',
          senderId: settings.notifications.smsConfig?.senderId || ''
        },
        emailConfig: {
          host: settings.notifications.emailConfig?.host || '',
          port: settings.notifications.emailConfig?.port || 587,
          username: settings.notifications.emailConfig?.username || '',
          password: settings.notifications.emailConfig?.password || '',
          fromEmail: settings.notifications.emailConfig?.fromEmail || '',
          fromName: settings.notifications.emailConfig?.fromName || ''
        },
        templates: {
          donationThankYou: {
            whatsapp: settings.notifications.templates?.donationThankYou?.whatsapp || 'Thank you {donorName} for your ₹{amount} donation to {templeName} for {event}. Your contribution supports our temple activities.',
            sms: settings.notifications.templates?.donationThankYou?.sms || 'Thank you {donorName} for your ₹{amount} donation to {templeName}. Receipt: {receiptId}',
            email: settings.notifications.templates?.donationThankYou?.email || 'Dear {donorName}, Thank you for your generous donation of ₹{amount}.'
          },
          inventoryUsage: {
            whatsapp: settings.notifications.templates?.inventoryUsage?.whatsapp || 'Dear {donorName}, your donated {itemType} of {quantity} was used today for {purpose} in {templeName}. Thank you!',
            sms: settings.notifications.templates?.inventoryUsage?.sms || 'Your donated {itemType} was used for {purpose} at {templeName}. Thank you for your support!'
          },
          eventReminder: {
            whatsapp: settings.notifications.templates?.eventReminder?.whatsapp || 'Reminder: {eventName} is on {eventDate} at {templeName}. Your participation is valuable.',
            sms: settings.notifications.templates?.eventReminder?.sms || 'Reminder: {eventName} on {eventDate} at {templeName}.'
          }
        }
      });
    }
  }, [settings]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const parts = field.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current = newData;
        for (let i = 0; i < parts.length - 1; i++) {
          current[parts[i]] = { ...current[parts[i]] };
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
        return newData;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateSettings('notifications', formData);
  };

  const handleTest = async (e) => {
    e.preventDefault();
    if (testData.recipient) {
      await testNotification(testData.type, testData.recipient);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure WhatsApp, SMS, and Email notifications for donors and events
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
        {/* WhatsApp Configuration */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-md font-medium text-gray-900">WhatsApp Notifications</h4>
              <p className="text-sm text-gray-500">Configure WhatsApp Business API for notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableWhatsApp}
                onChange={(e) => handleInputChange('enableWhatsApp', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-temple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-temple-600"></div>
            </label>
          </div>
          
          {formData.enableWhatsApp && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">API Key</label>
                <input
                  type="password"
                  value={formData.whatsAppConfig.apiKey}
                  onChange={(e) => handleInputChange('whatsAppConfig.apiKey', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                  placeholder="Enter WhatsApp API key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number ID</label>
                <input
                  type="text"
                  value={formData.whatsAppConfig.phoneNumberId}
                  onChange={(e) => handleInputChange('whatsAppConfig.phoneNumberId', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                  placeholder="Phone number ID"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Business Account ID</label>
                <input
                  type="text"
                  value={formData.whatsAppConfig.businessAccountId}
                  onChange={(e) => handleInputChange('whatsAppConfig.businessAccountId', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                  placeholder="Business account ID"
                />
              </div>
            </div>
          )}
        </div>

        {/* SMS Configuration */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-md font-medium text-gray-900">SMS Notifications</h4>
              <p className="text-sm text-gray-500">Configure SMS gateway for text notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableSMS}
                onChange={(e) => handleInputChange('enableSMS', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-temple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-temple-600"></div>
            </label>
          </div>
          
          {formData.enableSMS && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">SMS Provider</label>
                <select
                  value={formData.smsConfig.provider}
                  onChange={(e) => handleInputChange('smsConfig.provider', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                >
                  <option value="twilio">Twilio</option>
                  <option value="msg91">MSG91</option>
                  <option value="textlocal">TextLocal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">API Key</label>
                <input
                  type="password"
                  value={formData.smsConfig.apiKey}
                  onChange={(e) => handleInputChange('smsConfig.apiKey', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                  placeholder="Enter SMS API key"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Sender ID</label>
                <input
                  type="text"
                  value={formData.smsConfig.senderId}
                  onChange={(e) => handleInputChange('smsConfig.senderId', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                  placeholder="6 character sender ID"
                  maxLength="6"
                />
              </div>
            </div>
          )}
        </div>

        {/* Email Configuration */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-md font-medium text-gray-900">Email Notifications</h4>
              <p className="text-sm text-gray-500">Configure SMTP settings for email notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableEmail}
                onChange={(e) => handleInputChange('enableEmail', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-temple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-temple-600"></div>
            </label>
          </div>
          
          {formData.enableEmail && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">SMTP Host</label>
                <input
                  type="text"
                  value={formData.emailConfig.host}
                  onChange={(e) => handleInputChange('emailConfig.host', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">SMTP Port</label>
                <input
                  type="number"
                  value={formData.emailConfig.port}
                  onChange={(e) => handleInputChange('emailConfig.port', parseInt(e.target.value))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                  placeholder="587"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  value={formData.emailConfig.username}
                  onChange={(e) => handleInputChange('emailConfig.username', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                  placeholder="your-email@gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={formData.emailConfig.password}
                  onChange={(e) => handleInputChange('emailConfig.password', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                  placeholder="App password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">From Email</label>
                <input
                  type="email"
                  value={formData.emailConfig.fromEmail}
                  onChange={(e) => handleInputChange('emailConfig.fromEmail', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                  placeholder="noreply@temple.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">From Name</label>
                <input
                  type="text"
                  value={formData.emailConfig.fromName}
                  onChange={(e) => handleInputChange('emailConfig.fromName', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                  placeholder="Temple Management System"
                />
              </div>
            </div>
          )}
        </div>

        {/* Message Templates */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 mb-4">Message Templates</h4>
          <p className="text-sm text-gray-500 mb-4">
            Customize notification templates. Use variables like {'{donorName}'}, {'{amount}'}, {'{templeName}'}, {'{receiptId}'}, etc.
          </p>
          
          <div className="space-y-6">
            {/* Donation Thank You Templates */}
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-3">Donation Thank You</h5>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">WhatsApp Template</label>
                  <textarea
                    value={formData.templates.donationThankYou.whatsapp}
                    onChange={(e) => handleInputChange('templates.donationThankYou.whatsapp', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                    rows="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">SMS Template</label>
                  <textarea
                    value={formData.templates.donationThankYou.sms}
                    onChange={(e) => handleInputChange('templates.donationThankYou.sms', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                    rows="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Template</label>
                  <textarea
                    value={formData.templates.donationThankYou.email}
                    onChange={(e) => handleInputChange('templates.donationThankYou.email', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                    rows="3"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Notification Section */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="text-md font-medium text-gray-900 mb-4">Test Notifications</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Notification Type</label>
              <select
                value={testData.type}
                onChange={(e) => setTestData(prev => ({ ...prev, type: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {testData.type === 'email' ? 'Email Address' : 'Phone Number'}
              </label>
              <input
                type={testData.type === 'email' ? 'email' : 'tel'}
                value={testData.recipient}
                onChange={(e) => setTestData(prev => ({ ...prev, recipient: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                placeholder={testData.type === 'email' ? 'test@example.com' : '+91 9876543210'}
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing || !testData.recipient}
                className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {testing ? 'Testing...' : 'Send Test'}
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-temple-600 to-saffron-500 hover:from-temple-700 hover:to-saffron-600 transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  Saving...
                </>
              ) : (
                'Save Notification Settings'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

const SystemPreferencesTab = ({ settings, updateSettings, saving }) => {
  const [formData, setFormData] = useState({
    currency: 'INR',
    language: 'en',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    fiscalYearStart: '04-01',
    backupFrequency: 'daily',
    backupRetention: 30,
    sessionTimeout: 60,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false
    }
  });

  useEffect(() => {
    if (settings?.systemPrefs) {
      setFormData({
        currency: settings.systemPrefs.currency || 'INR',
        language: settings.systemPrefs.language || 'en',
        timezone: settings.systemPrefs.timezone || 'Asia/Kolkata',
        dateFormat: settings.systemPrefs.dateFormat || 'DD/MM/YYYY',
        fiscalYearStart: settings.systemPrefs.fiscalYearStart || '04-01',
        backupFrequency: settings.systemPrefs.backupFrequency || 'daily',
        backupRetention: settings.systemPrefs.backupRetention || 30,
        sessionTimeout: settings.systemPrefs.sessionTimeout || 60,
        passwordPolicy: {
          minLength: settings.systemPrefs.passwordPolicy?.minLength || 8,
          requireUppercase: settings.systemPrefs.passwordPolicy?.requireUppercase || true,
          requireLowercase: settings.systemPrefs.passwordPolicy?.requireLowercase || true,
          requireNumbers: settings.systemPrefs.passwordPolicy?.requireNumbers || true,
          requireSpecialChars: settings.systemPrefs.passwordPolicy?.requireSpecialChars || false
        }
      });
    }
  }, [settings]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateSettings('systemPrefs', formData);
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">System Preferences</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure system-wide settings including language, timezone, and security policies
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
        {/* Localization Settings */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Localization & Display</h4>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
              >
                <option value="INR">Indian Rupee (₹)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
                <option value="GBP">British Pound (£)</option>
                <option value="CAD">Canadian Dollar (C$)</option>
                <option value="AUD">Australian Dollar (A$)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Language</label>
              <select
                value={formData.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="ta">Tamil</option>
                <option value="te">Telugu</option>
                <option value="kn">Kannada</option>
                <option value="ml">Malayalam</option>
                <option value="gu">Gujarati</option>
                <option value="mr">Marathi</option>
                <option value="bn">Bengali</option>
                <option value="pa">Punjabi</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Timezone</label>
              <select
                value={formData.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Date Format</label>
              <select
                value={formData.dateFormat}
                onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (Indian)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                <option value="DD-MM-YYYY">DD-MM-YYYY</option>
              </select>
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Fiscal Year Start</label>
              <select
                value={formData.fiscalYearStart}
                onChange={(e) => handleInputChange('fiscalYearStart', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
              >
                <option value="04-01">April 1st (Indian Financial Year)</option>
                <option value="01-01">January 1st (Calendar Year)</option>
                <option value="07-01">July 1st (US Government FY)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security & Session Settings */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Security & Sessions</h4>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
              <input
                type="number"
                value={formData.sessionTimeout}
                onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                min="15"
                max="480"
              />
              <p className="mt-1 text-xs text-gray-500">Users will be logged out after this period of inactivity</p>
            </div>
          </div>
          
          <div className="mt-6">
            <h5 className="text-sm font-medium text-gray-900 mb-3">Password Policy</h5>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Minimum Length</label>
                <input
                  type="number"
                  value={formData.passwordPolicy.minLength}
                  onChange={(e) => handleInputChange('passwordPolicy.minLength', parseInt(e.target.value))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                  min="6"
                  max="20"
                />
              </div>
            </div>
            
            <div className="mt-4 space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireUppercase"
                  checked={formData.passwordPolicy.requireUppercase}
                  onChange={(e) => handleInputChange('passwordPolicy.requireUppercase', e.target.checked)}
                  className="h-4 w-4 text-temple-600 focus:ring-temple-500 border-gray-300 rounded"
                />
                <label htmlFor="requireUppercase" className="ml-2 block text-sm text-gray-900">
                  Require uppercase letters
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireLowercase"
                  checked={formData.passwordPolicy.requireLowercase}
                  onChange={(e) => handleInputChange('passwordPolicy.requireLowercase', e.target.checked)}
                  className="h-4 w-4 text-temple-600 focus:ring-temple-500 border-gray-300 rounded"
                />
                <label htmlFor="requireLowercase" className="ml-2 block text-sm text-gray-900">
                  Require lowercase letters
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireNumbers"
                  checked={formData.passwordPolicy.requireNumbers}
                  onChange={(e) => handleInputChange('passwordPolicy.requireNumbers', e.target.checked)}
                  className="h-4 w-4 text-temple-600 focus:ring-temple-500 border-gray-300 rounded"
                />
                <label htmlFor="requireNumbers" className="ml-2 block text-sm text-gray-900">
                  Require numbers
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireSpecialChars"
                  checked={formData.passwordPolicy.requireSpecialChars}
                  onChange={(e) => handleInputChange('passwordPolicy.requireSpecialChars', e.target.checked)}
                  className="h-4 w-4 text-temple-600 focus:ring-temple-500 border-gray-300 rounded"
                />
                <label htmlFor="requireSpecialChars" className="ml-2 block text-sm text-gray-900">
                  Require special characters (!@#$%^&*)
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Backup Settings */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Backup Configuration</h4>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Backup Frequency</label>
              <select
                value={formData.backupFrequency}
                onChange={(e) => handleInputChange('backupFrequency', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Backup Retention (days)</label>
              <input
                type="number"
                value={formData.backupRetention}
                onChange={(e) => handleInputChange('backupRetention', parseInt(e.target.value))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                min="7"
                max="365"
              />
              <p className="mt-1 text-xs text-gray-500">How long to keep backup files before deletion</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-temple-600 to-saffron-500 hover:from-temple-700 hover:to-saffron-600 transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  Saving...
                </>
              ) : (
                'Save System Preferences'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

const FinancialTab = ({ settings, updateSettings, saving }) => (
  <div className="bg-white shadow rounded-lg p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Settings</h3>
    <div className="text-center py-8">
      <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2 text-sm text-gray-500">Fund categories, tax settings, and approval limits will be implemented here</p>
    </div>
  </div>
);

const InventoryTab = ({ settings, updateSettings, saving }) => (
  <div className="bg-white shadow rounded-lg p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Settings</h3>
    <div className="text-center py-8">
      <ArchiveBoxIcon className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2 text-sm text-gray-500">Barcode settings, alerts, and storage configuration will be implemented here</p>
    </div>
  </div>
);

const EventsTab = ({ settings, updateSettings, saving }) => (
  <div className="bg-white shadow rounded-lg p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Event Management Settings</h3>
    <div className="text-center py-8">
      <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2 text-sm text-gray-500">Recurring events, reminders, and calendar integration will be implemented here</p>
    </div>
  </div>
);

const SecurityTab = ({ settings, updateSettings, saving }) => (
  <div className="bg-white shadow rounded-lg p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
    <div className="text-center py-8">
      <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2 text-sm text-gray-500">Password policies, 2FA, and security preferences will be implemented here</p>
    </div>
  </div>
);

const IntegrationsTab = ({ settings, updateSettings, saving }) => (
  <div className="bg-white shadow rounded-lg p-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Integration Settings</h3>
    <div className="text-center py-8">
      <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2 text-sm text-gray-500">UPI, payment gateways, and external service integration will be implemented here</p>
    </div>
  </div>
);

const BackupTab = ({ settings, updateSettings, saving }) => {
  const [backupInfo, setBackupInfo] = useState(null);
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);

  useEffect(() => {
    fetchBackupInfo();
  }, []);

  const fetchBackupInfo = async () => {
    try {
      setLoadingBackup(true);
      const token = localStorage.getItem('temple_token');
      const response = await fetch('/api/settings/backup-info', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setBackupInfo(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch backup info:', error);
    } finally {
      setLoadingBackup(false);
    }
  };

  const createBackup = async () => {
    try {
      setCreatingBackup(true);
      const token = localStorage.getItem('temple_token');
      const response = await fetch('/api/settings/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        fetchBackupInfo(); // Refresh backup info
        // Show success notification would be handled by parent component
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
    } finally {
      setCreatingBackup(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* System Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">System Information</h3>
          <p className="mt-1 text-sm text-gray-500">
            Current system status and version information
          </p>
        </div>
        
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Application Version</dt>
              <dd className="mt-1 text-sm text-gray-900">Temple Tracker v1.0.0</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Database Status</dt>
              <dd className="mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-green-600 bg-green-100">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1"></div>
                  Connected
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Server Uptime</dt>
              <dd className="mt-1 text-sm text-gray-900">2 days, 14 hours</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Node.js Version</dt>
              <dd className="mt-1 text-sm text-gray-900">v18.0.0</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Environment</dt>
              <dd className="mt-1 text-sm text-gray-900">Production</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(new Date())}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Backup Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Backup Management</h3>
              <p className="mt-1 text-sm text-gray-500">
                Monitor and manage database backups
              </p>
            </div>
            <button
              onClick={fetchBackupInfo}
              disabled={loadingBackup}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500 disabled:opacity-50"
            >
              {loadingBackup ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4">
          {loadingBackup ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-temple-600"></div>
            </div>
          ) : backupInfo ? (
            <div className="space-y-6">
              {/* Backup Status */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Backup Status</h4>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(backupInfo.status)}`}>
                        {backupInfo.status === 'healthy' && <CheckCircleIcon className="w-3 h-3 mr-1" />}
                        {backupInfo.status === 'warning' && <ExclamationTriangleIcon className="w-3 h-3 mr-1" />}
                        {backupInfo.status.charAt(0).toUpperCase() + backupInfo.status.slice(1)}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Backup</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(backupInfo.lastBackup)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Next Scheduled</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(backupInfo.nextBackup)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Backup Size</dt>
                    <dd className="mt-1 text-sm text-gray-900">{backupInfo.backupSize}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Total Backups</dt>
                    <dd className="mt-1 text-sm text-gray-900">{backupInfo.backupCount}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Storage Location</dt>
                    <dd className="mt-1 text-sm text-gray-900">{backupInfo.backupLocation}</dd>
                  </div>
                </dl>
              </div>

              {/* Manual Backup */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-md font-medium text-gray-900">Manual Backup</h4>
                    <p className="mt-1 text-sm text-gray-500">
                      Create an immediate backup of your data
                    </p>
                  </div>
                  <button
                    onClick={createBackup}
                    disabled={creatingBackup}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-temple-600 to-saffron-500 hover:from-temple-700 hover:to-saffron-600 transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500"
                  >
                    {creatingBackup ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Backup...
                      </>
                    ) : (
                      <>
                        <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                        Create Backup Now
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Backup Settings Info */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Backup Configuration</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Frequency</dt>
                      <dd className="mt-1 text-sm text-gray-900 capitalize">{settings?.systemPrefs?.backupFrequency || 'Daily'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Retention Period</dt>
                      <dd className="mt-1 text-sm text-gray-900">{settings?.systemPrefs?.backupRetention || 30} days</dd>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    To modify these settings, go to the System Preferences tab.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Unable to load backup information</p>
              <button
                onClick={fetchBackupInfo}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-temple-600 bg-temple-100 hover:bg-temple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Storage Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Storage Information</h3>
          <p className="mt-1 text-sm text-gray-500">
            Database and file storage usage
          </p>
        </div>
        
        <div className="px-6 py-4">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Database Storage</span>
                <span className="text-sm text-gray-500">245 MB / 1 GB</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-temple-600 h-2 rounded-full" style={{width: '24.5%'}}></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">File Storage</span>
                <span className="text-sm text-gray-500">156 MB / 500 MB</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-saffron-500 h-2 rounded-full" style={{width: '31.2%'}}></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Records</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">12,543</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Active Users</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">24</dd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;