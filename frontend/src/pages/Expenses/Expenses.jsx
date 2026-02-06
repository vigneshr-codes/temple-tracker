import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addNotification } from '../../features/ui/uiSlice';
import { getEvents } from '../../features/events/eventSlice';
import { hasPermission, canAccessModule } from '../../utils/permissions';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  CurrencyRupeeIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  LinkIcon,
  PrinterIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

// Add Expense Modal Component
const AddExpenseModal = ({ onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { events } = useSelector((state) => state.events);
  const [loading, setLoading] = useState(false);
  const [availableFunds, setAvailableFunds] = useState([]);
  const [fundsSummary, setFundsSummary] = useState({ totalBalances: { cash: 0, upi: 0, total: 0 } });
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: '',
    vendor: {
      name: '',
      contact: '',
      address: ''
    },
    event: 'general',
    customEvent: '',
    specificEvent: '',
    eventSelectionType: 'general', // 'general' or 'specific'
    bills: [],
    notes: '',
    billDate: new Date().toISOString().split('T')[0], // Current date as default
    paymentMethod: 'cash', // Always include payment method
    fundCategory: '', // Which fund to pay from
    payImmediately: false // Whether to pay now or just create as pending
  });

  // Category options matching backend model
  const categoryOptions = [
    { value: 'cooking-gas-fuel', label: 'Cooking Gas/Fuel' },
    { value: 'labor-charges', label: 'Labor Charges' },
    { value: 'electricity-bill', label: 'Electricity Bill' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'other-temple-expenses', label: 'Other Temple Expenses' },
    { value: 'water-bill', label: 'Water Bill' },
    { value: 'festival-expenses', label: 'Festival Expenses' },
    { value: 'anadhanam-supplies', label: 'Anadhanam Supplies' },
    { value: 'cleaning-supplies', label: 'Cleaning Supplies' },
    { value: 'other', label: 'Other' }
  ];

  // Event options matching backend model
  const eventOptions = [
    { value: 'general', label: 'General Temple Operations' },
    { value: 'new-moon-day', label: 'New Moon Day (Amavasya)' },
    { value: 'full-moon-day', label: 'Full Moon Day (Purnima)' },
    { value: 'guru-poojai', label: 'Guru Poojai' },
    { value: 'uthira-nakshatram', label: 'Uthira Nakshatram' },
    { value: 'adi-ammavasai', label: 'Adi Ammavasai' },
    { value: 'custom', label: 'Custom Event' }
  ];

  // Fund categories for payment selection
  const fundCategories = [
    { value: 'general', label: 'General Temple Operations' },
    { value: 'maintenance', label: 'Maintenance & Repairs' },
    { value: 'festival', label: 'Festival Expenses' },
    { value: 'anadhanam', label: 'Free Meal Distribution' },
    { value: 'construction', label: 'Construction Projects' },
    { value: 'emergency', label: 'Emergency Expenses' }
  ];

  useEffect(() => {
    fetchAvailableFunds();
  }, []);

  const fetchAvailableFunds = async () => {
    try {
      const token = localStorage.getItem('temple_token');
      const response = await fetch('/api/funds', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setAvailableFunds(data.data);
        if (data.summary) {
          setFundsSummary(data.summary);
        }
      }
    } catch (error) {
      console.error('Error fetching funds:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getAvailableBalance = (fundCategory, paymentMethod) => {
    const fund = availableFunds.find(f => f.category === fundCategory);
    if (!fund) return 0;
    return paymentMethod === 'cash' ? fund.balance.cash : fund.balance.upi;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('temple_token');
      
      // If paying immediately, check fund balance
      if (expenseForm.payImmediately) {
        const availableBalance = getAvailableBalance(expenseForm.fundCategory, expenseForm.paymentMethod);
        if (parseFloat(expenseForm.amount) > availableBalance) {
          dispatch(addNotification({
            type: 'error',
            message: `Insufficient ${expenseForm.paymentMethod} balance in ${expenseForm.fundCategory} fund. Available: ${formatCurrency(availableBalance)}`
          }));
          setLoading(false);
          return;
        }
      }

      // Create expense
      const expenseData = { ...expenseForm };
      
      // Handle event selection logic
      if (expenseForm.eventSelectionType === 'specific' && expenseForm.specificEvent) {
        expenseData.specificEvent = expenseForm.specificEvent;
      } else {
        // Remove specificEvent if using general events
        delete expenseData.specificEvent;
      }
      
      // Clean up UI-only fields
      delete expenseData.eventSelectionType;
      
      if (!expenseForm.payImmediately) {
        delete expenseData.fundCategory;
        // Keep paymentMethod as it's required by backend validation
      }

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(expenseData)
      });

      const data = await response.json();
      
      if (data.success) {
        const expenseId = data.data._id;
        
        // If paying immediately, allocate from fund
        if (expenseForm.payImmediately) {
          const fundResponse = await fetch(`/api/funds/allocate-expense/${expenseId}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fundCategory: expenseForm.fundCategory,
              paymentMethod: expenseForm.paymentMethod
            })
          });

          const fundData = await fundResponse.json();
          
          if (fundData.success) {
            dispatch(addNotification({
              type: 'success',
              message: `Expense created and paid from ${expenseForm.fundCategory} fund!`
            }));
          } else {
            dispatch(addNotification({
              type: 'warning',
              message: `Expense created but payment failed: ${fundData.message}`
            }));
          }
        } else {
          dispatch(addNotification({
            type: 'success',
            message: 'Expense created successfully!'
          }));
        }
        
        onSuccess();
      } else {
        dispatch(addNotification({
          type: 'error',
          message: data.message || 'Failed to create expense'
        }));
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Network error occurred'
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 max-w-4xl shadow-lg rounded-md bg-white">
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add New Expense</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <input
                type="text"
                required
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                placeholder="Enter expense description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                  className="w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                required
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
              >
                <option value="">Select Category</option>
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Event Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event/Purpose
              </label>
              
              {/* Event Type Selection */}
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="eventSelectionType"
                    value="general"
                    checked={expenseForm.eventSelectionType === 'general'}
                    onChange={(e) => setExpenseForm({
                      ...expenseForm, 
                      eventSelectionType: e.target.value,
                      specificEvent: ''
                    })}
                    className="sr-only"
                  />
                  <div className={`border rounded-lg p-3 text-center text-sm font-medium ${
                    expenseForm.eventSelectionType === 'general'
                      ? 'border-temple-500 bg-temple-50 text-temple-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}>
                    General Category
                  </div>
                </label>
                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="eventSelectionType"
                    value="specific"
                    checked={expenseForm.eventSelectionType === 'specific'}
                    onChange={(e) => setExpenseForm({
                      ...expenseForm, 
                      eventSelectionType: e.target.value,
                      event: 'general'
                    })}
                    className="sr-only"
                  />
                  <div className={`border rounded-lg p-3 text-center text-sm font-medium ${
                    expenseForm.eventSelectionType === 'specific'
                      ? 'border-temple-500 bg-temple-50 text-temple-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}>
                    Specific Event
                  </div>
                </label>
              </div>

              {/* General Event Categories */}
              {expenseForm.eventSelectionType === 'general' && (
                <div className="mt-3">
                  <select
                    value={expenseForm.event}
                    onChange={(e) => setExpenseForm({...expenseForm, event: e.target.value})}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                  >
                    {eventOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Specific Event Selection */}
              {expenseForm.eventSelectionType === 'specific' && (
                <div className="mt-3">
                  <select
                    value={expenseForm.specificEvent}
                    onChange={(e) => setExpenseForm({...expenseForm, specificEvent: e.target.value})}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                  >
                    <option value="">Select a specific event...</option>
                    {events
                      .filter(event => event.status !== 'cancelled')
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map((event) => {
                        const eventDate = new Date(event.date);
                        const isCompleted = eventDate < new Date() || event.status === 'completed';
                        return (
                          <option key={event._id} value={event._id}>
                            {event.name} - {eventDate.toLocaleDateString()}
                            {isCompleted ? ' (Completed)' : ''}
                          </option>
                        );
                      })}
                  </select>
                  {expenseForm.specificEvent && (
                    <p className="mt-1 text-xs text-gray-500">
                      💡 You can add expenses to completed events for record keeping
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bill Date *
              </label>
              <input
                type="date"
                required
                value={expenseForm.billDate}
                onChange={(e) => setExpenseForm({...expenseForm, billDate: e.target.value})}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
              />
            </div>

            {/* Vendor Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor Name *
              </label>
              <input
                type="text"
                required
                value={expenseForm.vendor.name}
                onChange={(e) => setExpenseForm({
                  ...expenseForm,
                  vendor: {...expenseForm.vendor, name: e.target.value}
                })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                placeholder="Enter vendor name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor Contact
              </label>
              <input
                type="tel"
                value={expenseForm.vendor.contact}
                onChange={(e) => setExpenseForm({
                  ...expenseForm,
                  vendor: {...expenseForm.vendor, contact: e.target.value}
                })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                placeholder="Phone or email"
              />
            </div>
          </div>

          {/* Payment Options - Only show for admin users */}
          {user?.role === 'admin' && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="payImmediately"
                  checked={expenseForm.payImmediately}
                  onChange={(e) => setExpenseForm({...expenseForm, payImmediately: e.target.checked})}
                  className="h-4 w-4 text-temple-600 focus:ring-temple-500 border-gray-300 rounded"
                />
                <label htmlFor="payImmediately" className="ml-2 block text-sm text-gray-700">
                  Pay immediately from fund balance (Admin Only)
                </label>
              </div>

            {expenseForm.payImmediately && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pay from Fund *
                  </label>
                  <select
                    required
                    value={expenseForm.fundCategory}
                    onChange={(e) => setExpenseForm({...expenseForm, fundCategory: e.target.value})}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                  >
                    <option value="">Select Fund</option>
                    {fundCategories.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    required
                    value={expenseForm.paymentMethod}
                    onChange={(e) => setExpenseForm({...expenseForm, paymentMethod: e.target.value})}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>

                {expenseForm.fundCategory && (
                  <div className="md:col-span-2">
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-sm text-blue-800">
                        Available {expenseForm.paymentMethod} balance: <strong>{formatCurrency(getAvailableBalance(expenseForm.fundCategory, expenseForm.paymentMethod))}</strong>
                      </p>
                      {parseFloat(expenseForm.amount) > getAvailableBalance(expenseForm.fundCategory, expenseForm.paymentMethod) && (
                        <p className="text-sm text-red-600 mt-1">
                          ⚠️ Insufficient balance for this expense
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {/* Notes */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              value={expenseForm.notes}
              onChange={(e) => setExpenseForm({...expenseForm, notes: e.target.value})}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
              placeholder="Additional notes (optional)"
            />
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-temple-600 to-saffron-500 hover:from-temple-700 hover:to-saffron-600 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating...' : (expenseForm.payImmediately ? 'Create & Pay' : 'Create Expense')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Expenses = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  // Check if user has access to the expenses module
  if (!canAccessModule(user, 'expenses')) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to access the expenses module.
          </p>
        </div>
      </div>
    );
  }
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    event: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [summary, setSummary] = useState({
    totalAmount: 0,
    approvedAmount: 0,
    pendingAmount: 0,
    totalExpenses: 0
  });
  const [availableInventory, setAvailableInventory] = useState([]);
  const [availableFunds, setAvailableFunds] = useState([]);
  const [showChallanModal, setShowChallanModal] = useState(false);
  const [challanData, setChallanData] = useState(null);

  // Category options matching backend model
  const categoryOptions = [
    { value: 'cooking-gas-fuel', label: 'Cooking Gas/Fuel' },
    { value: 'labor-charges', label: 'Labor Charges' },
    { value: 'electricity-bill', label: 'Electricity Bill' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'other-temple-expenses', label: 'Other Temple Expenses' },
    { value: 'water-bill', label: 'Water Bill' },
    { value: 'festival-expenses', label: 'Festival Expenses' },
    { value: 'anadhanam-supplies', label: 'Anadhanam Supplies' },
    { value: 'cleaning-supplies', label: 'Cleaning Supplies' },
    { value: 'other', label: 'Other' }
  ];

  // Event options matching backend model
  const eventOptions = [
    { value: 'general', label: 'General Temple Operations' },
    { value: 'new-moon-day', label: 'New Moon Day (Amavasya)' },
    { value: 'full-moon-day', label: 'Full Moon Day (Purnima)' },
    { value: 'guru-poojai', label: 'Guru Poojai' },
    { value: 'uthira-nakshatram', label: 'Uthira Nakshatram' },
    { value: 'adi-ammavasai', label: 'Adi Ammavasai' },
    { value: 'custom', label: 'Custom Event' }
  ];

  // Status options
  const statusOptions = [
    { value: 'pending', label: 'Pending', icon: ClockIcon, color: 'text-yellow-600' },
    { value: 'approved', label: 'Approved', icon: CheckCircleIcon, color: 'text-green-600' },
    { value: 'paid', label: 'Paid', icon: CheckCircleIcon, color: 'text-blue-600' },
    { value: 'rejected', label: 'Rejected', icon: XCircleIcon, color: 'text-red-600' }
  ];

  useEffect(() => {
    fetchExpenses();
  }, [filters, pagination.current]);

  useEffect(() => {
    fetchAvailableFunds();
    // Fetch events for dropdown if user has permission
    if (canAccessModule(user, 'events')) {
      dispatch(getEvents());
    }
  }, [dispatch, user]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('temple_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: pagination.current.toString(),
        limit: '10'
      });

      // Add filters if they exist
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== 'search') {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`http://localhost:3001/api/expenses?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        // Filter by search term on frontend (for now)
        let filteredExpenses = data.data;
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredExpenses = data.data.filter(expense =>
            expense.description.toLowerCase().includes(searchLower) ||
            expense.vendor.name.toLowerCase().includes(searchLower) ||
            expense.expenseId.toLowerCase().includes(searchLower)
          );
        }

        setExpenses(filteredExpenses);
        setPagination(data.pagination);
        
        // Calculate summary
        const summary = {
          totalAmount: data.totalAmount || 0,
          approvedAmount: data.totals?.find(t => t._id === 'approved')?.total || 0,
          pendingAmount: data.totals?.find(t => t._id === 'pending')?.total || 0,
          totalExpenses: data.pagination.total
        };
        setSummary(summary);
      } else {
        setError(data.message || 'Failed to fetch expenses');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Fetch expenses error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      status: '',
      event: '',
      startDate: '',
      endDate: '',
      search: ''
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const fetchAvailableFunds = async () => {
    try {
      const token = localStorage.getItem('temple_token');
      const response = await fetch('/api/funds', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setAvailableFunds(data.data);
      }
    } catch (error) {
      console.error('Error fetching funds:', error);
    }
  };

  const fetchAvailableInventory = async () => {
    try {
      const token = localStorage.getItem('temple_token');
      const response = await fetch('/api/expenses/inventory/available', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setAvailableInventory(data.data);
      } else {
        console.error('Failed to fetch inventory:', data.message);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const generateChallan = async (expenseId) => {
    try {
      const token = localStorage.getItem('temple_token');
      const response = await fetch(`/api/expenses/${expenseId}/challan`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setChallanData(data.data);
        setShowChallanModal(true);
      } else {
        setError(data.message || 'Failed to generate challan');
      }
    } catch (error) {
      console.error('Error generating challan:', error);
      setError('Failed to generate challan');
    }
  };

  const printChallan = () => {
    const printContent = document.getElementById('challan-content');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Challan - ${challanData?.challanNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .details { margin: 20px 0; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f2f2f2; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getCategoryLabel = (category) => {
    const option = categoryOptions.find(opt => opt.value === category);
    return option ? option.label : category;
  };

  const getEventLabel = (event, customEvent) => {
    if (event === 'custom' && customEvent) return customEvent;
    const option = eventOptions.find(opt => opt.value === event);
    return option ? option.label : event;
  };

  const getStatusConfig = (status) => {
    return statusOptions.find(opt => opt.value === status) || statusOptions[0];
  };

  const handleViewDetails = (expense) => {
    setSelectedExpense(expense);
    setShowDetailModal(true);
  };

  const handleApproveExpense = async (expenseId, status) => {
    try {
      const token = localStorage.getItem('temple_token');
      const response = await fetch(`/api/expenses/${expenseId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status,
          remarks: status === 'approved' ? 'Approved by admin' : 'Rejected by admin'
        })
      });

      const data = await response.json();
      if (data.success) {
        // Refresh expenses list
        fetchExpenses();
        // Update selected expense for modal
        setSelectedExpense(data.data);
        // Show notification
        dispatch(addNotification({
          type: 'success',
          message: `Expense ${status} successfully`
        }));
      } else {
        dispatch(addNotification({
          type: 'error',
          message: data.message || `Failed to ${status} expense`
        }));
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: `Failed to ${status} expense`
      }));
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Expense Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track and manage temple expenses across different categories and events
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          {hasPermission(user, 'expenses', 'create') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-temple-600 to-saffron-500 hover:from-temple-700 hover:to-saffron-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Expense
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyRupeeIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Expenses</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(summary.totalAmount)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(summary.approvedAmount)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(summary.pendingAmount)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyRupeeIcon className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Available Balance</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(availableFunds.reduce((total, fund) => total + (fund.balance.cash + fund.balance.upi), 0))}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </h3>
            {(filters.category || filters.status || filters.event || filters.search || filters.startDate || filters.endDate) && (
              <button
                onClick={clearFilters}
                className="text-sm text-temple-600 hover:text-temple-800"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-temple-500 focus:border-temple-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-temple-500 focus:border-temple-500"
              >
                <option value="">All Categories</option>
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-temple-500 focus:border-temple-500"
              >
                <option value="">All Statuses</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event
              </label>
              <select
                value={filters.event}
                onChange={(e) => handleFilterChange('event', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-temple-500 focus:border-temple-500"
              >
                <option value="">All Events</option>
                {eventOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-temple-500 focus:border-temple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-temple-500 focus:border-temple-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-8 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Expenses List */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Expense Records ({pagination.total})
          </h3>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-temple-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-6 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {Object.values(filters).some(v => v) ? 'Try adjusting your filters.' : 'Get started by adding a new expense.'}
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expense
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expenses.map((expense) => {
                      const statusConfig = getStatusConfig(expense.status);
                      const StatusIcon = statusConfig.icon;
                      
                      return (
                        <tr key={expense._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {expense.expenseId}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {expense.description}
                              </div>
                              <div className="text-xs text-gray-400">
                                Vendor: {expense.vendor?.name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {getCategoryLabel(expense.category)}
                            </span>
                            {expense.event !== 'general' && (
                              <div className="text-xs text-gray-500 mt-1">
                                {getEventLabel(expense.event, expense.customEvent)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              expense.status === 'approved' ? 'bg-green-100 text-green-800' :
                              expense.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              expense.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(expense.billDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewDetails(expense)}
                                className="text-temple-600 hover:text-temple-900"
                                title="View Details"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => generateChallan(expense._id)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Generate Challan"
                              >
                                <DocumentArrowDownIcon className="h-4 w-4" />
                              </button>
                              {user?.role === 'admin' && expense.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApproveExpense(expense._id, 'approved')}
                                    className="text-green-600 hover:text-green-900"
                                    title="Approve Expense"
                                  >
                                    <CheckCircleIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleApproveExpense(expense._id, 'rejected')}
                                    className="text-red-600 hover:text-red-900"
                                    title="Reject Expense"
                                  >
                                    <XCircleIcon className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              {hasPermission(user, 'expenses', 'update') && (expense.createdBy?._id === user?._id || user?.role === 'admin') && expense.status !== 'approved' && (
                                <button
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Edit Expense"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                              )}
                              {hasPermission(user, 'expenses', 'delete') && expense.status !== 'approved' && (
                                <button
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete Expense"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                    disabled={pagination.current === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                    disabled={pagination.current === pagination.pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(pagination.current - 1) * 10 + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.current * 10, pagination.total)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                        disabled={pagination.current === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setPagination(prev => ({ ...prev, current: page }))}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === pagination.current
                              ? 'z-10 bg-temple-50 border-temple-500 text-temple-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                        disabled={pagination.current === pagination.pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Expense Details Modal */}
      {showDetailModal && selectedExpense && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Expense Details - {selectedExpense.expenseId}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Expense ID:</span>
                      <span className="text-sm text-gray-900">{selectedExpense.expenseId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Description:</span>
                      <span className="text-sm text-gray-900">{selectedExpense.description}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Amount:</span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(selectedExpense.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Category:</span>
                      <span className="text-sm text-gray-900">{getCategoryLabel(selectedExpense.category)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Bill Date:</span>
                      <span className="text-sm text-gray-900">{formatDate(selectedExpense.billDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Payment Method:</span>
                      <span className="text-sm text-gray-900 capitalize">{selectedExpense.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                {/* Status & Approval */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Status & Approval</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedExpense.status === 'approved' ? 'bg-green-100 text-green-800' :
                        selectedExpense.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedExpense.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {getStatusConfig(selectedExpense.status).label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Created Date:</span>
                      <span className="text-sm text-gray-900">{formatDate(selectedExpense.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Created By:</span>
                      <span className="text-sm text-gray-900">{selectedExpense.createdBy?.name}</span>
                    </div>
                    {selectedExpense.approvedBy && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Approved By:</span>
                          <span className="text-sm text-gray-900">{selectedExpense.approvedBy?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Approval Date:</span>
                          <span className="text-sm text-gray-900">{formatDate(selectedExpense.approvalDate)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Vendor & Event Information */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Vendor Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Vendor Name:</span>
                      <span className="text-sm text-gray-900">{selectedExpense.vendor?.name}</span>
                    </div>
                    {selectedExpense.vendor?.contact && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Contact:</span>
                        <span className="text-sm text-gray-900">{selectedExpense.vendor?.contact}</span>
                      </div>
                    )}
                    {selectedExpense.vendor?.address && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Address:</span>
                        <span className="text-sm text-gray-900">{selectedExpense.vendor?.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Event Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Event:</span>
                      <span className="text-sm text-gray-900">{getEventLabel(selectedExpense.event, selectedExpense.customEvent)}</span>
                    </div>
                  </div>
                </div>

                {selectedExpense.notes && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Notes</h4>
                    <p className="text-sm text-gray-900">{selectedExpense.notes}</p>
                  </div>
                )}

                {selectedExpense.remarks && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Admin Remarks</h4>
                    <p className="text-sm text-gray-900">{selectedExpense.remarks}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
              {user?.role === 'admin' && selectedExpense.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleApproveExpense(selectedExpense._id, 'approved')}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white text-sm font-medium rounded-md hover:from-green-700 hover:to-green-600 transition-all"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2 inline" />
                    Approve Expense
                  </button>
                  <button
                    onClick={() => handleApproveExpense(selectedExpense._id, 'rejected')}
                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-medium rounded-md hover:from-red-700 hover:to-red-600 transition-all"
                  >
                    <XCircleIcon className="h-4 w-4 mr-2 inline" />
                    Reject Expense
                  </button>
                </>
              )}
              <button
                onClick={() => generateChallan(selectedExpense._id)}
                className="px-4 py-2 bg-gradient-to-r from-temple-600 to-saffron-500 text-white text-sm font-medium rounded-md hover:from-temple-700 hover:to-saffron-600 transition-all"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2 inline" />
                Generate Challan
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Challan Modal */}
      {showChallanModal && challanData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Expense Challan
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={printChallan}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <PrinterIcon className="h-4 w-4 mr-2" />
                    Print
                  </button>
                  <button
                    onClick={() => setShowChallanModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div id="challan-content" className="bg-white p-6">
                <div className="header text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900">Temple Management System</h1>
                  <h2 className="text-xl font-semibold text-gray-700 mt-2">Expense Challan</h2>
                  <p className="text-sm text-gray-600 mt-1">Challan No: {challanData.challanNumber}</p>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="details">
                    <h3 className="font-semibold text-gray-900 mb-3">Expense Details</h3>
                    <p><span className="font-medium">Expense ID:</span> {challanData.expense.expenseId}</p>
                    <p><span className="font-medium">Category:</span> {getCategoryLabel(challanData.expense.category)}</p>
                    <p><span className="font-medium">Description:</span> {challanData.expense.description}</p>
                    <p><span className="font-medium">Amount:</span> {formatCurrency(challanData.expense.amount)}</p>
                    <p><span className="font-medium">Bill Date:</span> {formatDate(challanData.expense.billDate)}</p>
                  </div>
                  <div className="details">
                    <h3 className="font-semibold text-gray-900 mb-3">Vendor Details</h3>
                    <p><span className="font-medium">Name:</span> {challanData.expense.vendor.name}</p>
                    {challanData.expense.vendor.contact && (
                      <p><span className="font-medium">Contact:</span> {challanData.expense.vendor.contact}</p>
                    )}
                    {challanData.expense.vendor.address && (
                      <p><span className="font-medium">Address:</span> {challanData.expense.vendor.address}</p>
                    )}
                    <p><span className="font-medium">Payment Method:</span> {challanData.expense.paymentMethod}</p>
                    <p><span className="font-medium">Event:</span> {challanData.expense.event === 'custom' ? challanData.expense.customEvent : eventOptions.find(e => e.value === challanData.expense.event)?.label}</p>
                  </div>
                </div>

                {challanData.linkedItems && challanData.linkedItems.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Linked Inventory Items</h3>
                    <div className="overflow-x-auto">
                      <table className="table min-w-full">
                        <thead>
                          <tr>
                            <th className="font-semibold text-left">Inventory ID</th>
                            <th className="font-semibold text-left">Item Type</th>
                            <th className="font-semibold text-left">Description</th>
                            <th className="font-semibold text-left">Quantity</th>
                            <th className="font-semibold text-left">Unit</th>
                            <th className="font-semibold text-left">Donor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {challanData.linkedItems.map((item, index) => (
                            <tr key={index}>
                              <td>{item.inventoryId?.inventoryId || 'N/A'}</td>
                              <td>{item.inventoryId?.itemType || 'N/A'}</td>
                              <td>{item.description || item.inventoryId?.description || '-'}</td>
                              <td>{item.inventoryId?.quantity || '-'}</td>
                              <td>{item.inventoryId?.unit || '-'}</td>
                              <td>{item.inventoryId?.donor?.name || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 mt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Generated on: {formatDate(challanData.generatedDate)}</p>
                      <p className="text-sm text-gray-600">Generated by: {user?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">Total Amount: {formatCurrency(challanData.totalAmount)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal - Full Implementation */}
      {showAddModal && <AddExpenseModal onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); fetchExpenses(); }} />}
    </div>
  );
};

export default Expenses;