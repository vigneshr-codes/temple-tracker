import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addNotification } from '../../features/ui/uiSlice';
import { hasPermission } from '../../utils/permissions';
import { uploadLogo, BACKEND_STATIC_URL } from '../../features/settings/settingsSlice';
import authService from '../../services/authService';
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
  XMarkIcon,
  ClipboardDocumentListIcon
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
    { id: 'notif-logs', name: 'Notification Logs', icon: ClipboardDocumentListIcon },
    // { id: 'system', name: 'System Preferences', icon: CogIcon },
    // { id: 'financial', name: 'Financial', icon: CurrencyDollarIcon },
    // { id: 'inventory', name: 'Inventory', icon: ArchiveBoxIcon },
    // { id: 'events', name: 'Events', icon: CalendarDaysIcon },
    // { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    // { id: 'integrations', name: 'Integrations', icon: LinkIcon },
    // { id: 'backup', name: 'Backup & System', icon: CloudArrowUpIcon }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await authService.api.get('/settings');
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to fetch settings'
      }));
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (section, data) => {
    try {
      setSaving(true);
      const { data: result } = await authService.api.put(`/settings/${section}`, data);
      if (result.success) {
        setSettings(result.data);
        dispatch(addNotification({ type: 'success', message: result.message || 'Settings updated successfully' }));
      }
    } catch (error) {
      dispatch(addNotification({ type: 'error', message: error.response?.data?.message || 'Failed to update settings' }));
    } finally {
      setSaving(false);
    }
  };

  const testNotification = async (channel, recipient) => {
    try {
      setTestingNotification(true);
      const { data } = await authService.api.post('/settings/test-notification', { channel, recipient });
      dispatch(addNotification({
        type: data.success ? 'success' : 'error',
        message: data.message
      }));
    } catch (error) {
      dispatch(addNotification({ type: 'error', message: error.response?.data?.message || 'Failed to send test notification' }));
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
        {activeTab === 'notif-logs' && (
          <NotificationLogsTab />
        )}
        {/* TODO: implement remaining tabs
        {activeTab === 'system' && (
          <SystemPreferencesTab settings={settings} updateSettings={updateSettings} saving={saving} />
        )}
        {activeTab === 'financial' && (
          <FinancialTab settings={settings} updateSettings={updateSettings} saving={saving} />
        )}
        {activeTab === 'inventory' && (
          <InventoryTab settings={settings} updateSettings={updateSettings} saving={saving} />
        )}
        {activeTab === 'events' && (
          <EventsTab settings={settings} updateSettings={updateSettings} saving={saving} />
        )}
        {activeTab === 'security' && (
          <SecurityTab settings={settings} updateSettings={updateSettings} saving={saving} />
        )}
        {activeTab === 'integrations' && (
          <IntegrationsTab settings={settings} updateSettings={updateSettings} saving={saving} />
        )}
        {activeTab === 'backup' && (
          <BackupTab settings={settings} updateSettings={updateSettings} saving={saving} />
        )}
        */}
      </div>
    </div>
  );
};

// Placeholder components for each tab - will be implemented next
const TempleConfigTab = ({ settings, updateSettings, saving }) => {
  const dispatch = useDispatch();
  const { templeConfig } = useSelector(state => state.settings);
  const fileInputRef = useRef(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

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
    panNumber: '',
    exemption80GNumber: '',
    exemption12ANumber: '',
    upiId: '',
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
        panNumber: settings.templeConfig.panNumber || '',
        exemption80GNumber: settings.templeConfig.exemption80GNumber || '',
        exemption12ANumber: settings.templeConfig.exemption12ANumber || '',
        upiId: settings.templeConfig.upiId || '',
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

  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('logo', logoFile);
    const result = await dispatch(uploadLogo(formData));
    if (result.meta.requestStatus === 'fulfilled') {
      dispatch(addNotification({ type: 'success', message: 'Logo uploaded successfully' }));
      setLogoFile(null);
      setLogoPreview(null);
    } else {
      dispatch(addNotification({ type: 'error', message: result.payload || 'Logo upload failed' }));
    }
    setUploadingLogo(false);
  };

  const currentLogoUrl = templeConfig?.logo
    ? `${BACKEND_STATIC_URL}${templeConfig.logo}`
    : null;

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Temple Configuration</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure basic temple information and contact details
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
        {/* Temple Logo */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Temple Logo</h4>
          <div className="flex items-center space-x-6">
            <div className="h-20 w-20 rounded-xl overflow-hidden bg-gradient-to-br from-saffron-100 to-temple-100 flex items-center justify-center border-2 border-gray-200 flex-shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
              ) : currentLogoUrl ? (
                <img src={currentLogoUrl} alt="Temple logo" className="h-full w-full object-cover" />
              ) : (
                <svg className="h-10 w-10 text-temple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              )}
            </div>
            <div className="flex flex-col space-y-2">
              <p className="text-sm text-gray-500">PNG, JPG, WebP up to 2MB</p>
              <div className="flex items-center space-x-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleLogoFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500"
                >
                  Choose File
                </button>
                {logoFile && (
                  <button
                    type="button"
                    onClick={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-temple-600 to-saffron-500 hover:from-temple-700 hover:to-saffron-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500"
                  >
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </button>
                )}
              </div>
              {logoFile && (
                <p className="text-xs text-gray-500">Selected: {logoFile.name}</p>
              )}
            </div>
          </div>
        </div>

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
              <label htmlFor="panNumber" className="block text-sm font-medium text-gray-700">
                PAN Number
              </label>
              <input
                type="text"
                id="panNumber"
                value={formData.panNumber}
                onChange={(e) => handleInputChange('panNumber', e.target.value.toUpperCase())}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                placeholder="AAAAA0000A"
              />
            </div>

            <div>
              <label htmlFor="exemption80GNumber" className="block text-sm font-medium text-gray-700">
                80G UR Number
              </label>
              <input
                type="text"
                id="exemption80GNumber"
                value={formData.exemption80GNumber}
                onChange={(e) => handleInputChange('exemption80GNumber', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                placeholder="AAAAA0000A/80G/2024-25/0000"
              />
            </div>

            <div>
              <label htmlFor="exemption12ANumber" className="block text-sm font-medium text-gray-700">
                12A UR Number
              </label>
              <input
                type="text"
                id="exemption12ANumber"
                value={formData.exemption12ANumber}
                onChange={(e) => handleInputChange('exemption12ANumber', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                placeholder="AAAAA0000A/12A/2024-25/0000"
              />
            </div>

            <div>
              <label htmlFor="upiId" className="block text-sm font-medium text-gray-700">
                UPI ID
              </label>
              <input
                type="text"
                id="upiId"
                value={formData.upiId}
                onChange={(e) => handleInputChange('upiId', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500"
                placeholder="templename@upi"
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
  const TEMPLATE_KEYS = [
    { key: 'donationCash',   label: 'Donation — Cash',     vars: ['{donorName}','{amount}','{templeName}','{event}','{receiptId}','{date}'] },
    { key: 'donationUpi',    label: 'Donation — UPI',      vars: ['{donorName}','{amount}','{templeName}','{event}','{receiptId}','{date}'] },
    { key: 'donationInkind', label: 'Donation — In-Kind',  vars: ['{donorName}','{itemList}','{templeName}','{event}','{date}'] },
    { key: 'inventoryUsed',  label: 'Inventory Item Used', vars: ['{donorName}','{itemType}','{quantity}','{unit}','{purpose}','{templeName}','{date}'] },
    { key: 'expiryAlert',    label: 'Expiry Alert',        vars: ['{itemName}','{quantity}','{expiryDate}','{daysLeft}','{templeName}'] },
    { key: 'eventReminder',  label: 'Event Reminder',      vars: ['{eventName}','{eventDate}','{daysLeft}','{templeName}'] },
  ];

  const PREF_TRIGGERS = [
    { key: 'donation',      label: 'Donation Received',   recipient: 'Donor', channels: ['whatsapp','sms','email'] },
    { key: 'inventoryUsed', label: 'Inventory Item Used', recipient: 'Donor', channels: ['whatsapp','sms','email'] },
    { key: 'expiryAlert',   label: 'Expiry Alert',        recipient: 'Admin', channels: ['sms','email'], hasDays: true },
    { key: 'eventReminder', label: 'Event Reminder',      recipient: 'Admin', channels: ['whatsapp','sms','email'], hasDays: true },
  ];

  const emptyTpl = { whatsappTemplateName: '', smsTemplateId: '', smsTemplateText: '', emailSubject: '', emailBody: '' };

  const [formData, setFormData] = useState({
    enableWhatsApp: false, enableSMS: false, enableEmail: false,
    whatsAppConfig: { apiKey: '', phoneNumberId: '', businessAccountId: '' },
    smsConfig: { provider: 'msg91', apiKey: '', senderId: '', dltTemplateIds: { donationCash: '', donationUpi: '', donationInkind: '', inventoryUsed: '', expiryAlert: '', eventReminder: '' } },
    emailConfig: { host: '', port: 587, username: '', password: '', fromEmail: '', fromName: '' },
    templates: {
      donationCash: { ...emptyTpl },
      donationUpi: { ...emptyTpl },
      donationInkind: { ...emptyTpl },
      inventoryUsed: { ...emptyTpl },
      expiryAlert: { smsTemplateId: '', smsTemplateText: '', emailSubject: '', emailBody: '' },
      eventReminder: { ...emptyTpl },
    },
    notificationPreferences: {
      donation:      { enabled: true,  channels: { whatsapp: true,  sms: false, email: false } },
      inventoryUsed: { enabled: true,  channels: { whatsapp: true,  sms: false, email: false } },
      expiryAlert:   { enabled: false, daysBefore: 7,  channels: { sms: false, email: true } },
      eventReminder: { enabled: false, daysBefore: 3,  channels: { whatsapp: false, sms: false, email: true } },
    },
    adminContact: { phone: '', email: '' },
  });

  const [activeTplKey, setActiveTplKey] = useState('donationCash');
  const [testData, setTestData] = useState({ channel: 'whatsapp', recipient: '' });

  useEffect(() => {
    if (settings?.notifications) {
      const n = settings.notifications;
      const mt = (src, def) => ({ ...def, ...src });
      setFormData({
        enableWhatsApp: n.enableWhatsApp ?? false,
        enableSMS: n.enableSMS ?? false,
        enableEmail: n.enableEmail ?? false,
        whatsAppConfig: { apiKey: n.whatsAppConfig?.apiKey || '', phoneNumberId: n.whatsAppConfig?.phoneNumberId || '', businessAccountId: n.whatsAppConfig?.businessAccountId || '' },
        smsConfig: {
          provider: 'msg91',
          apiKey: n.smsConfig?.apiKey || '',
          senderId: n.smsConfig?.senderId || '',
          dltTemplateIds: {
            donationCash: n.smsConfig?.dltTemplateIds?.donationCash || '',
            donationUpi: n.smsConfig?.dltTemplateIds?.donationUpi || '',
            donationInkind: n.smsConfig?.dltTemplateIds?.donationInkind || '',
            inventoryUsed: n.smsConfig?.dltTemplateIds?.inventoryUsed || '',
            expiryAlert: n.smsConfig?.dltTemplateIds?.expiryAlert || '',
            eventReminder: n.smsConfig?.dltTemplateIds?.eventReminder || '',
          }
        },
        emailConfig: { host: n.emailConfig?.host || '', port: n.emailConfig?.port || 587, username: n.emailConfig?.username || '', password: n.emailConfig?.password || '', fromEmail: n.emailConfig?.fromEmail || '', fromName: n.emailConfig?.fromName || '' },
        templates: {
          donationCash:   mt(n.templates?.donationCash,   emptyTpl),
          donationUpi:    mt(n.templates?.donationUpi,    emptyTpl),
          donationInkind: mt(n.templates?.donationInkind, emptyTpl),
          inventoryUsed:  mt(n.templates?.inventoryUsed,  emptyTpl),
          expiryAlert:    mt(n.templates?.expiryAlert,    { smsTemplateId: '', smsTemplateText: '', emailSubject: '', emailBody: '' }),
          eventReminder:  mt(n.templates?.eventReminder,  emptyTpl),
        },
        notificationPreferences: {
          donation:      { enabled: n.notificationPreferences?.donation?.enabled ?? true,  channels: { whatsapp: n.notificationPreferences?.donation?.channels?.whatsapp ?? true,  sms: n.notificationPreferences?.donation?.channels?.sms ?? false, email: n.notificationPreferences?.donation?.channels?.email ?? false } },
          inventoryUsed: { enabled: n.notificationPreferences?.inventoryUsed?.enabled ?? true,  channels: { whatsapp: n.notificationPreferences?.inventoryUsed?.channels?.whatsapp ?? true,  sms: n.notificationPreferences?.inventoryUsed?.channels?.sms ?? false, email: n.notificationPreferences?.inventoryUsed?.channels?.email ?? false } },
          expiryAlert:   { enabled: n.notificationPreferences?.expiryAlert?.enabled ?? false, daysBefore: n.notificationPreferences?.expiryAlert?.daysBefore ?? 7,  channels: { sms: n.notificationPreferences?.expiryAlert?.channels?.sms ?? false, email: n.notificationPreferences?.expiryAlert?.channels?.email ?? true } },
          eventReminder: { enabled: n.notificationPreferences?.eventReminder?.enabled ?? false, daysBefore: n.notificationPreferences?.eventReminder?.daysBefore ?? 3, channels: { whatsapp: n.notificationPreferences?.eventReminder?.channels?.whatsapp ?? false, sms: n.notificationPreferences?.eventReminder?.channels?.sms ?? false, email: n.notificationPreferences?.eventReminder?.channels?.email ?? true } },
        },
        adminContact: { phone: n.adminContact?.phone || '', email: n.adminContact?.email || '' },
      });
    }
  }, [settings]);

  const set = (field, value) => {
    const parts = field.split('.');
    setFormData(prev => {
      const next = { ...prev };
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) {
        cur[parts[i]] = { ...cur[parts[i]] };
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const Toggle = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-temple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-temple-600"></div>
    </label>
  );

  const iCls = "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-temple-500 focus:border-temple-500 text-sm";
  const lCls = "block text-sm font-medium text-gray-700";

  return (
    <div className="space-y-6">

      {/* Channel Configuration */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Channel Configuration</h3>
          <p className="mt-1 text-sm text-gray-500">Enable channels and enter credentials</p>
        </div>
        <div className="px-6 py-4 space-y-5">

          {/* WhatsApp */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">WhatsApp Business — Meta Cloud API</h4>
                <p className="text-xs text-gray-500">graph.facebook.com/v20.0</p>
              </div>
              <Toggle checked={formData.enableWhatsApp} onChange={v => set('enableWhatsApp', v)} />
            </div>
            {formData.enableWhatsApp && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={lCls}>Access Token (Bearer)</label>
                  <input type="password" className={iCls} value={formData.whatsAppConfig.apiKey} onChange={e => set('whatsAppConfig.apiKey', e.target.value)} placeholder="EAAxxxxx..." />
                </div>
                <div>
                  <label className={lCls}>Phone Number ID</label>
                  <input type="text" className={iCls} value={formData.whatsAppConfig.phoneNumberId} onChange={e => set('whatsAppConfig.phoneNumberId', e.target.value)} placeholder="Numeric Phone Number ID" />
                </div>
                <div>
                  <label className={lCls}>Business Account ID</label>
                  <input type="text" className={iCls} value={formData.whatsAppConfig.businessAccountId} onChange={e => set('whatsAppConfig.businessAccountId', e.target.value)} placeholder="WhatsApp Business Account ID" />
                </div>
              </div>
            )}
          </div>

          {/* SMS - MSG91 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">SMS — MSG91</h4>
                <p className="text-xs text-gray-500">DLT-registered flow via control.msg91.com</p>
              </div>
              <Toggle checked={formData.enableSMS} onChange={v => set('enableSMS', v)} />
            </div>
            {formData.enableSMS && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={lCls}>Auth Key (API Key)</label>
                  <input type="password" className={iCls} value={formData.smsConfig.apiKey} onChange={e => set('smsConfig.apiKey', e.target.value)} placeholder="MSG91 Auth Key" />
                </div>
                <div>
                  <label className={lCls}>Sender ID (6 chars)</label>
                  <input type="text" className={iCls} value={formData.smsConfig.senderId} onChange={e => set('smsConfig.senderId', e.target.value)} placeholder="TEMPLE" maxLength="6" />
                </div>
              </div>
            )}
          </div>

          {/* Email - SMTP */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Email — SMTP (Nodemailer)</h4>
                <p className="text-xs text-gray-500">Works with Gmail, Outlook, custom SMTP</p>
              </div>
              <Toggle checked={formData.enableEmail} onChange={v => set('enableEmail', v)} />
            </div>
            {formData.enableEmail && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={lCls}>SMTP Host</label>
                  <input type="text" className={iCls} value={formData.emailConfig.host} onChange={e => set('emailConfig.host', e.target.value)} placeholder="smtp.gmail.com" />
                </div>
                <div>
                  <label className={lCls}>SMTP Port</label>
                  <input type="number" className={iCls} value={formData.emailConfig.port} onChange={e => set('emailConfig.port', parseInt(e.target.value))} placeholder="587" />
                </div>
                <div>
                  <label className={lCls}>Username</label>
                  <input type="text" className={iCls} value={formData.emailConfig.username} onChange={e => set('emailConfig.username', e.target.value)} placeholder="you@gmail.com" />
                </div>
                <div>
                  <label className={lCls}>Password / App Password</label>
                  <input type="password" className={iCls} value={formData.emailConfig.password} onChange={e => set('emailConfig.password', e.target.value)} />
                </div>
                <div>
                  <label className={lCls}>From Email</label>
                  <input type="email" className={iCls} value={formData.emailConfig.fromEmail} onChange={e => set('emailConfig.fromEmail', e.target.value)} placeholder="noreply@temple.com" />
                </div>
                <div>
                  <label className={lCls}>From Name</label>
                  <input type="text" className={iCls} value={formData.emailConfig.fromName} onChange={e => set('emailConfig.fromName', e.target.value)} placeholder="Temple Tracker" />
                </div>
              </div>
            )}
          </div>

          {/* Admin Contact */}
          <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Admin Contact <span className="font-normal text-gray-400">(for cron-based alerts: expiry, event reminders)</span></h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={lCls}>Admin Phone</label>
                <input type="tel" className={iCls} value={formData.adminContact.phone} onChange={e => set('adminContact.phone', e.target.value)} placeholder="9876543210" />
              </div>
              <div>
                <label className={lCls}>Admin Email</label>
                <input type="email" className={iCls} value={formData.adminContact.email} onChange={e => set('adminContact.email', e.target.value)} placeholder="admin@temple.com" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
          <p className="mt-1 text-sm text-gray-500">Choose which events trigger notifications and via which channels</p>
        </div>
        <div className="px-6 py-4 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 pr-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trigger</th>
                <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Enabled</th>
                <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">WhatsApp</th>
                <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">SMS</th>
                <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Days Before</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {PREF_TRIGGERS.map(({ key, label, recipient, channels, hasDays }) => {
                const pref = formData.notificationPreferences[key];
                return (
                  <tr key={key}>
                    <td className="py-3 pr-4 text-sm font-medium text-gray-900">{label}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${recipient === 'Donor' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{recipient}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Toggle checked={pref.enabled} onChange={v => set(`notificationPreferences.${key}.enabled`, v)} />
                    </td>
                    <td className="py-3 px-3 text-center">
                      {channels.includes('whatsapp') ? (
                        <input type="checkbox" className="h-4 w-4 text-temple-600 border-gray-300 rounded focus:ring-temple-500" checked={pref.channels.whatsapp ?? false} onChange={e => set(`notificationPreferences.${key}.channels.whatsapp`, e.target.checked)} disabled={!pref.enabled} />
                      ) : <span className="text-gray-300 text-sm">—</span>}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input type="checkbox" className="h-4 w-4 text-temple-600 border-gray-300 rounded focus:ring-temple-500" checked={pref.channels.sms ?? false} onChange={e => set(`notificationPreferences.${key}.channels.sms`, e.target.checked)} disabled={!pref.enabled} />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input type="checkbox" className="h-4 w-4 text-temple-600 border-gray-300 rounded focus:ring-temple-500" checked={pref.channels.email ?? false} onChange={e => set(`notificationPreferences.${key}.channels.email`, e.target.checked)} disabled={!pref.enabled} />
                    </td>
                    <td className="py-3 px-3 text-center">
                      {hasDays ? (
                        <input type="number" className="block w-16 mx-auto border border-gray-300 rounded-md py-1 px-2 text-sm text-center focus:outline-none focus:ring-temple-500 focus:border-temple-500" value={pref.daysBefore ?? 7} onChange={e => set(`notificationPreferences.${key}.daysBefore`, parseInt(e.target.value))} min="1" max="30" disabled={!pref.enabled} />
                      ) : <span className="text-gray-300 text-sm">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Templates */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Message Templates</h3>
          <p className="mt-1 text-sm text-gray-500">Configure per-trigger templates. Use <code className="bg-gray-100 px-1 rounded text-xs">{'{varName}'}</code> placeholders.</p>
        </div>
        <div className="px-6 py-4">
          <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-gray-100">
            {TEMPLATE_KEYS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTplKey(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${activeTplKey === key ? 'bg-temple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {(() => {
            const tplMeta = TEMPLATE_KEYS.find(t => t.key === activeTplKey);
            const tpl = formData.templates[activeTplKey] || {};
            const hasWA = activeTplKey !== 'expiryAlert';
            return (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-xs text-gray-500 mr-1">Variables:</span>
                  {tplMeta.vars.map(v => <code key={v} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">{v}</code>)}
                </div>
                {hasWA && (
                  <div>
                    <label className={lCls}>WhatsApp Template Name</label>
                    <input type="text" className={iCls} value={tpl.whatsappTemplateName || ''} onChange={e => set(`templates.${activeTplKey}.whatsappTemplateName`, e.target.value)} placeholder="e.g. donation_thankyou_cash" />
                    <p className="mt-1 text-xs text-gray-400">Exact name as approved in Meta Business Manager</p>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={lCls}>SMS DLT Template ID</label>
                    <input type="text" className={iCls} value={tpl.smsTemplateId || ''} onChange={e => set(`templates.${activeTplKey}.smsTemplateId`, e.target.value)} placeholder="MSG91 DLT template ID" />
                  </div>
                  <div>
                    <label className={lCls}>SMS Template Text</label>
                    <textarea className={iCls} rows="2" value={tpl.smsTemplateText || ''} onChange={e => set(`templates.${activeTplKey}.smsTemplateText`, e.target.value)} placeholder="Dear {donorName}, ..." />
                  </div>
                </div>
                <div>
                  <label className={lCls}>Email Subject</label>
                  <input type="text" className={iCls} value={tpl.emailSubject || ''} onChange={e => set(`templates.${activeTplKey}.emailSubject`, e.target.value)} placeholder="e.g. Thank you for your donation - {receiptId}" />
                </div>
                <div>
                  <label className={lCls}>Email Body (HTML)</label>
                  <textarea className={`${iCls} font-mono`} rows="5" value={tpl.emailBody || ''} onChange={e => set(`templates.${activeTplKey}.emailBody`, e.target.value)} placeholder="<p>Dear {donorName},</p><p>Thank you...</p>" />
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Test Notification */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Test Notification</h3>
          <p className="mt-1 text-sm text-gray-500">Send a test message using the "Donation Cash" template with dummy data</p>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 items-end">
            <div>
              <label className={lCls}>Channel</label>
              <select className={iCls} value={testData.channel} onChange={e => setTestData(p => ({ ...p, channel: e.target.value }))}>
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
              </select>
            </div>
            <div>
              <label className={lCls}>{testData.channel === 'email' ? 'Email Address' : 'Phone Number'}</label>
              <input
                type={testData.channel === 'email' ? 'email' : 'tel'}
                className={iCls}
                value={testData.recipient}
                onChange={e => setTestData(p => ({ ...p, recipient: e.target.value }))}
                placeholder={testData.channel === 'email' ? 'test@example.com' : '9876543210'}
              />
            </div>
            <div>
              <button
                type="button"
                onClick={() => { if (testData.recipient) testNotification(testData.channel, testData.recipient); }}
                disabled={testing || !testData.recipient}
                className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {testing ? 'Sending...' : 'Send Test'}
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">Channel must be enabled and configured above. Result is logged in Notification Logs tab.</p>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end pb-2">
        <button
          type="button"
          onClick={() => updateSettings('notifications', formData)}
          disabled={saving}
          className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-temple-600 to-saffron-500 hover:from-temple-700 hover:to-saffron-600 transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500"
        >
          {saving ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>Saving...</>) : 'Save Notification Settings'}
        </button>
      </div>
    </div>
  );
};

const NotificationLogsTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', channel: '', trigger: '' });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 20 });
      if (filters.status) params.set('status', filters.status);
      if (filters.channel) params.set('channel', filters.channel);
      if (filters.trigger) params.set('trigger', filters.trigger);
      const { data } = await authService.api.get(`/settings/notification-logs?${params}`);
      if (data.success) {
        setLogs(data.data);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch notification logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const CHANNEL_COLORS = { whatsapp: 'bg-green-100 text-green-700', sms: 'bg-blue-100 text-blue-700', email: 'bg-purple-100 text-purple-700' };
  const STATUS_COLORS  = { sent: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700' };
  const TRIGGER_LABELS = { donation: 'Donation', inventoryUsed: 'Inv. Used', expiryAlert: 'Expiry Alert', eventReminder: 'Event Reminder', test: 'Test' };

  const setFilter = (key, val) => { setFilters(p => ({ ...p, [key]: val })); setPage(1); };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Notification Logs</h3>
            <p className="mt-1 text-sm text-gray-500">Audit trail of all notification attempts. Auto-refreshes every 30s.</p>
          </div>
          <button onClick={fetchLogs} disabled={loading} className="text-sm text-temple-600 hover:text-temple-700 font-medium disabled:opacity-50">
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 items-center">
          <select value={filters.status} onChange={e => setFilter('status', e.target.value)} className="text-sm border border-gray-300 rounded-md px-2 py-1 min-w-[110px] focus:outline-none focus:ring-temple-500 focus:border-temple-500">
            <option value="">All Status</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>
          <select value={filters.channel} onChange={e => setFilter('channel', e.target.value)} className="text-sm border border-gray-300 rounded-md px-2 py-1 min-w-[130px] focus:outline-none focus:ring-temple-500 focus:border-temple-500">
            <option value="">All Channels</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
            <option value="email">Email</option>
          </select>
          <select value={filters.trigger} onChange={e => setFilter('trigger', e.target.value)} className="text-sm border border-gray-300 rounded-md px-2 py-1 min-w-[140px] focus:outline-none focus:ring-temple-500 focus:border-temple-500">
            <option value="">All Triggers</option>
            <option value="donation">Donation</option>
            <option value="inventoryUsed">Inventory Used</option>
            <option value="expiryAlert">Expiry Alert</option>
            <option value="eventReminder">Event Reminder</option>
            <option value="test">Test</option>
          </select>
          <span className="text-xs text-gray-400">{pagination.total} total records</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading && logs.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-temple-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardDocumentListIcon className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No notification logs found.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date / Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trigger</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map(log => (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                    {new Date(log.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{TRIGGER_LABELS[log.trigger] || log.trigger}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${CHANNEL_COLORS[log.channel] || 'bg-gray-100 text-gray-700'}`}>{log.channel}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {log.recipientName && <div className="font-medium text-gray-900">{log.recipientName}</div>}
                    <div className="text-xs text-gray-500">{log.recipient}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[log.status] || 'bg-gray-100 text-gray-700'}`}>{log.status}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-red-600 max-w-xs truncate" title={log.error || ''}>{log.error || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-500">Page {pagination.current} of {pagination.pages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50">Previous</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.pages} className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50">Next</button>
          </div>
        </div>
      )}
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
      const { data } = await authService.api.get('/settings/backup-info');
      if (data.success) setBackupInfo(data.data);
    } catch (error) {
      console.error('Failed to fetch backup info:', error);
    } finally {
      setLoadingBackup(false);
    }
  };

  const createBackup = async () => {
    try {
      setCreatingBackup(true);
      const { data } = await authService.api.post('/settings/backup');
      if (data.success) fetchBackupInfo();
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