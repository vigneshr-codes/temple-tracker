import { useState, useEffect, Fragment } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Dialog, Transition } from '@headlessui/react';
import { addNotification } from '../../features/ui/uiSlice';
import { hasPermission, canAccessModule } from '../../utils/permissions';
import authService from '../../services/authService';
import {
  BanknotesIcon,
  CreditCardIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsRightLeftIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  BuildingLibraryIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Funds = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  // Check if user has access to the funds module
  if (!canAccessModule(user, 'funds')) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <BanknotesIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to access the funds module.
          </p>
        </div>
      </div>
    );
  }
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFund, setSelectedFund] = useState(null);
  const [showFundDetails, setShowFundDetails] = useState(false);
  const [showProcessDonation, setShowProcessDonation] = useState(false);
  const [selectedDonationIds, setSelectedDonationIds] = useState([]);
  const [bulkFundCategory, setBulkFundCategory] = useState('general');
  const [processingBulk, setProcessingBulk] = useState(false);
  const [showAllocateExpense, setShowAllocateExpense] = useState(false);
  const [showTransferFunds, setShowTransferFunds] = useState(false);
  const [pendingDonations, setPendingDonations] = useState([]);
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [totalBalances, setTotalBalances] = useState({ cash: 0, upi: 0, total: 0 });
  const [allocationForm, setAllocationForm] = useState({
    expenseId: '',
    fundCategory: 'general',
    paymentMethod: 'cash'
  });
  const [transferForm, setTransferForm] = useState({
    fromCategory: 'general',
    toCategory: 'maintenance',
    amount: '',
    method: 'cash',
    description: ''
  });

  // Fund categories with labels
  const fundCategories = [
    { value: 'general', label: 'General Temple Operations', icon: BuildingLibraryIcon, color: 'bg-blue-100 text-blue-800' },
    { value: 'maintenance', label: 'Maintenance & Repairs', icon: BanknotesIcon, color: 'bg-green-100 text-green-800' },
    { value: 'festival', label: 'Festival Expenses', icon: ChartBarIcon, color: 'bg-purple-100 text-purple-800' },
    { value: 'anadhanam', label: 'Free Meal Distribution', icon: CreditCardIcon, color: 'bg-orange-100 text-orange-800' },
    { value: 'construction', label: 'Construction Projects', icon: BanknotesIcon, color: 'bg-red-100 text-red-800' },
    { value: 'emergency', label: 'Emergency Expenses', icon: ChartBarIcon, color: 'bg-yellow-100 text-yellow-800' }
  ];

  useEffect(() => {
    fetchFunds();
    fetchPendingDonations();
    fetchPendingExpenses();
  }, []);

  const fetchFunds = async () => {
    try {
      setLoading(true);
      setError('');

      const { data } = await authService.api.get('/funds');
      if (data.success) {
        setFunds(data.data);
        setTotalBalances(data.summary.totalBalances);
      } else {
        setError(data.message || 'Failed to fetch funds');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Fetch funds error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingDonations = async () => {
    try {
      const { data } = await authService.api.get('/donations?status=received&type=cash,upi');
      if (data.success) {
        setPendingDonations(data.data.filter(d => d.type === 'cash' || d.type === 'upi'));
      }
    } catch (error) {
      console.error('Error fetching pending donations:', error);
    }
  };

  const fetchPendingExpenses = async () => {
    try {
      const { data } = await authService.api.get('/expenses?status=approved');
      if (data.success) {
        setPendingExpenses(data.data);
      }
    } catch (error) {
      console.error('Error fetching pending expenses:', error);
    }
  };

  const processDonation = async (donationId, fundCategory = 'general') => {
    try {
      const { data } = await authService.api.post(`/funds/process-donation/${donationId}`, { fundCategory });
      if (data.success) {
        fetchFunds();
        fetchPendingDonations();
        showNotification(`Successfully processed donation into ${fundCategory} fund`, 'success');
      } else {
        showNotification(data.message || 'Failed to process donation', 'error');
      }
    } catch (error) {
      showNotification('Failed to process donation: ' + error.message, 'error');
    }
  };

  const processBulkDonations = async () => {
    if (!selectedDonationIds.length || !bulkFundCategory) return;
    setProcessingBulk(true);
    const results = await Promise.allSettled(
      selectedDonationIds.map(id =>
        authService.api.post(`/funds/process-donation/${id}`, { fundCategory: bulkFundCategory })
          .then(r => r.data)
      )
    );
    const succeeded = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
    const failed = results.length - succeeded;
    setProcessingBulk(false);
    setSelectedDonationIds([]);
    fetchFunds();
    fetchPendingDonations();
    if (succeeded > 0) {
      showNotification(`Processed ${succeeded} donation${succeeded > 1 ? 's' : ''} into ${bulkFundCategory} fund${failed > 0 ? ` (${failed} failed)` : ''}`, 'success');
    } else {
      showNotification('Failed to process donations', 'error');
    }
  };

  const allocateExpense = async (expenseId, fundCategory = 'general', paymentMethod = 'cash') => {
    try {
      const { data } = await authService.api.post(`/funds/allocate-expense/${expenseId}`, { fundCategory, paymentMethod });
      if (data.success) {
        setShowAllocateExpense(false);
        fetchFunds();
        fetchPendingExpenses();
        showNotification(`Successfully allocated expense from ${fundCategory} fund`, 'success');
      } else {
        showNotification(data.message || 'Failed to allocate expense', 'error');
      }
    } catch (error) {
      showNotification('Failed to allocate expense', 'error');
    }
  };

  const transferFunds = async (transferData) => {
    try {
      const { data } = await authService.api.post('/funds/transfer', transferData);
      if (data.success) {
        setShowTransferFunds(false);
        fetchFunds();
        setTransferForm({
          fromCategory: 'general',
          toCategory: 'maintenance',
          amount: '',
          method: 'cash',
          description: ''
        });
        showNotification(`Successfully transferred ${formatCurrency(transferData.amount)} from ${transferData.fromCategory} to ${transferData.toCategory} fund`, 'success');
      } else {
        showNotification(data.message || 'Failed to transfer funds', 'error');
      }
    } catch (error) {
      console.error('Error transferring funds:', error);
      showNotification('Failed to transfer funds', 'error');
    }
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

  const getFundCategoryInfo = (category) => {
    return fundCategories.find(cat => cat.value === category) || fundCategories[0];
  };

  // Notification helper function
  const showNotification = (message, type = 'success') => {
    dispatch(addNotification({ type, message }));
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
          <h1 className="text-2xl font-semibold text-gray-900">Fund Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track and manage temple funds from donations and allocate to expenses
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-2">
          {hasPermission(user, 'funds', 'allocate') && (
            <button
              onClick={() => {
                console.log('Process Donation button clicked');
                console.log('Pending donations:', pendingDonations);
                setShowProcessDonation(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-temple-600 to-saffron-500 hover:from-temple-700 hover:to-saffron-600 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500"
            >
              <ArrowUpIcon className="h-4 w-4 mr-2" />
              Process Donation
            </button>
          )}
          {hasPermission(user, 'funds', 'allocate') && (
            <button
              onClick={() => setShowAllocateExpense(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-temple-600 to-saffron-500 hover:from-temple-700 hover:to-saffron-600 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500"
            >
              <ArrowDownIcon className="h-4 w-4 mr-2" />
              Allocate Expense
            </button>
          )}
          {hasPermission(user, 'funds', 'allocate') && (
            <button
              onClick={() => setShowTransferFunds(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-temple-600 to-saffron-500 hover:from-temple-700 hover:to-saffron-600 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500"
            >
              <ArrowsRightLeftIcon className="h-4 w-4 mr-2" />
              Transfer Funds
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Total Balance Summary */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BanknotesIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Cash Balance</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(totalBalances.cash)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCardIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total UPI Balance</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(totalBalances.upi)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Available</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(totalBalances.total)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fund Categories */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Fund Categories</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {funds.map((fund) => {
            const categoryInfo = getFundCategoryInfo(fund.category);
            const IconComponent = categoryInfo.icon;
            
            return (
              <div key={fund._id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <IconComponent className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{categoryInfo.label}</p>
                        <p className="text-xs text-gray-500">Fund ID: {fund.fundId}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                      {fund.category}
                    </span>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Cash Balance</p>
                      <p className="text-sm font-semibold text-green-600">{formatCurrency(fund.balance.cash)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">UPI Balance</p>
                      <p className="text-sm font-semibold text-blue-600">{formatCurrency(fund.balance.upi)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-500">Total Available</p>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(fund.balance.total)}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFund(fund);
                          setShowFundDetails(true);
                        }}
                        className="text-temple-600 hover:text-temple-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-gray-500">
                      <span>Transactions: {fund.transactions?.length || 0}</span>
                      <span>Last Updated: {formatDate(fund.lastUpdated)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Action Summary */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Pending Donations to Process
            </h3>
            {pendingDonations.length > 0 ? (
              <div className="space-y-2">
                {pendingDonations.slice(0, 3).map((donation) => (
                  <div key={donation._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-medium">{donation.donor.name}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(donation.amount)} - {donation.type}</p>
                    </div>
                    {hasPermission(user, 'funds', 'allocate') && (
                      <button
                        onClick={() => processDonation(donation._id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <CheckCircleIcon className="h-6 w-6" />
                      </button>
                    )}
                  </div>
                ))}
                {pendingDonations.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{pendingDonations.length - 3} more donations
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No pending donations</p>
            )}
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Approved Expenses to Pay
            </h3>
            {pendingExpenses.length > 0 ? (
              <div className="space-y-2">
                {pendingExpenses.slice(0, 3).map((expense) => (
                  <div key={expense._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-medium">{expense.description}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(expense.amount)} - {expense.category}</p>
                    </div>
                    {hasPermission(user, 'funds', 'allocate') && (
                      <button
                        onClick={() => allocateExpense(expense._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <ClockIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {pendingExpenses.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{pendingExpenses.length - 3} more expenses
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No pending expenses</p>
            )}
          </div>
        </div>
      </div>

      {/* Process Donation Modal */}
      {showProcessDonation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto border w-full max-w-2xl shadow-lg rounded-lg bg-white">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Process Donations</h3>
              <button onClick={() => setShowProcessDonation(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {pendingDonations.length > 0 ? (
              <>
                {/* Bulk action bar */}
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-3">
                  {/* Select All checkbox */}
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-temple-600 focus:ring-temple-500"
                      checked={selectedDonationIds.length === pendingDonations.length}
                      ref={el => { if (el) el.indeterminate = selectedDonationIds.length > 0 && selectedDonationIds.length < pendingDonations.length; }}
                      onChange={(e) => setSelectedDonationIds(e.target.checked ? pendingDonations.map(d => d._id) : [])}
                    />
                    Select All ({pendingDonations.length})
                  </label>

                  <div className="flex items-center gap-2 ml-auto">
                    <select
                      value={bulkFundCategory}
                      onChange={(e) => setBulkFundCategory(e.target.value)}
                      className="text-sm border border-gray-300 rounded-md pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-temple-500 min-w-[200px]"
                    >
                      {fundCategories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={processBulkDonations}
                      disabled={!selectedDonationIds.length || processingBulk}
                      className="px-4 py-1.5 text-sm font-medium rounded-md text-white bg-gradient-to-r from-temple-600 to-saffron-500 hover:from-temple-700 hover:to-saffron-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {processingBulk
                        ? 'Processing...'
                        : `Process${selectedDonationIds.length ? ` (${selectedDonationIds.length})` : ''}`}
                    </button>
                  </div>
                </div>

                {/* Donation list */}
                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                  {pendingDonations.map((donation) => {
                    const isSelected = selectedDonationIds.includes(donation._id);
                    return (
                      <label
                        key={donation._id}
                        className={`flex items-center gap-4 px-6 py-3 cursor-pointer transition-colors ${isSelected ? 'bg-temple-50' : 'hover:bg-gray-50'}`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-temple-600 focus:ring-temple-500 flex-shrink-0"
                          checked={isSelected}
                          onChange={(e) => {
                            setSelectedDonationIds(prev =>
                              e.target.checked ? [...prev, donation._id] : prev.filter(id => id !== donation._id)
                            );
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{donation.donor.name}</p>
                          <p className="text-xs text-gray-500">{formatDate(donation.createdAt)} · {donation.type}</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                          {formatCurrency(donation.amount)}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    {selectedDonationIds.length} of {pendingDonations.length} selected
                  </p>
                  <button
                    onClick={() => setShowProcessDonation(false)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <div className="px-6 py-12 text-center">
                <CheckCircleIcon className="mx-auto h-10 w-10 text-green-400 mb-3" />
                <p className="text-gray-500">No pending donations to process</p>
                <button onClick={() => setShowProcessDonation(false)} className="mt-4 px-4 py-2 text-sm border rounded-md text-gray-700 hover:bg-gray-50">Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fund Details Modal */}
      {showFundDetails && selectedFund && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Fund Details: {getFundCategoryInfo(selectedFund.category).label}
                </h3>
                <button
                  onClick={() => setShowFundDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              {/* Fund Summary */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Cash Balance</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(selectedFund.balance.cash)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">UPI Balance</p>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(selectedFund.balance.upi)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Total Available</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(selectedFund.balance.total)}</p>
                  </div>
                </div>
                <div className="mt-3 text-center text-sm text-gray-600">
                  Fund ID: {selectedFund.fundId} | Created: {formatDate(selectedFund.createdAt)}
                </div>
              </div>

              {/* Transaction History */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Transaction History</h4>
                {selectedFund.transactions && selectedFund.transactions.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedFund.transactions.map((transaction, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(transaction.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                transaction.type === 'credit' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {transaction.type === 'credit' ? '+ Credit' : '- Debit'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <span className={transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                                {formatCurrency(transaction.amount)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                              {transaction.paymentMethod}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {transaction.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No transactions yet</p>
                )}
              </div>
              
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowFundDetails(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Allocate Expense Modal */}
      <Transition appear show={showAllocateExpense} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setShowAllocateExpense(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      Allocate Expense to Fund
                    </Dialog.Title>
                    <button
                      onClick={() => setShowAllocateExpense(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Expense Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Expense to Allocate
                      </label>
                      <select
                        value={allocationForm.expenseId}
                        onChange={(e) => setAllocationForm({...allocationForm, expenseId: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                        required
                      >
                        <option value="">Select an expense...</option>
                        {pendingExpenses.map((expense) => (
                          <option key={expense._id} value={expense._id}>
                            {expense.description} - {formatCurrency(expense.amount)} ({expense.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Fund Category Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Allocate from Fund
                      </label>
                      <select
                        value={allocationForm.fundCategory}
                        onChange={(e) => setAllocationForm({...allocationForm, fundCategory: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                        required
                      >
                        {fundCategories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Payment Method Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method
                      </label>
                      <select
                        value={allocationForm.paymentMethod}
                        onChange={(e) => setAllocationForm({...allocationForm, paymentMethod: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                        required
                      >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                      </select>
                    </div>

                    {/* Fund Balance Display */}
                    {allocationForm.fundCategory && (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm text-gray-600">
                          Available {allocationForm.paymentMethod} balance in {fundCategories.find(f => f.value === allocationForm.fundCategory)?.label}: 
                          <span className="font-medium ml-1">
                            {formatCurrency(
                              funds.find(f => f.category === allocationForm.fundCategory)?.balance?.[allocationForm.paymentMethod] || 0
                            )}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => {
                        if (allocationForm.expenseId && allocationForm.fundCategory) {
                          allocateExpense(allocationForm.expenseId, allocationForm.fundCategory, allocationForm.paymentMethod);
                          setAllocationForm({ expenseId: '', fundCategory: 'general', paymentMethod: 'cash' });
                        }
                      }}
                      disabled={!allocationForm.expenseId}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-temple-600 to-saffron-500 hover:from-temple-700 hover:to-saffron-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Allocate Expense
                    </button>
                    <button
                      onClick={() => setShowAllocateExpense(false)}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500"
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Transfer Funds Modal */}
      <Transition appear show={showTransferFunds} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setShowTransferFunds(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      Transfer Funds Between Categories
                    </Dialog.Title>
                    <button
                      onClick={() => setShowTransferFunds(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* From Fund Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transfer From Fund
                      </label>
                      <select
                        value={transferForm.fromCategory}
                        onChange={(e) => setTransferForm({...transferForm, fromCategory: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                        required
                      >
                        {fundCategories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* To Fund Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transfer To Fund
                      </label>
                      <select
                        value={transferForm.toCategory}
                        onChange={(e) => setTransferForm({...transferForm, toCategory: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                        required
                      >
                        {fundCategories.filter(cat => cat.value !== transferForm.fromCategory).map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Transfer Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transfer Amount
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">₹</span>
                        </div>
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={transferForm.amount}
                          onChange={(e) => setTransferForm({...transferForm, amount: e.target.value})}
                          className="block w-full pl-7 pr-12 rounded-md border-gray-300 focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method
                      </label>
                      <select
                        value={transferForm.method}
                        onChange={(e) => setTransferForm({...transferForm, method: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                        required
                      >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                      </select>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (Optional)
                      </label>
                      <textarea
                        value={transferForm.description}
                        onChange={(e) => setTransferForm({...transferForm, description: e.target.value})}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                        placeholder="Reason for transfer..."
                      />
                    </div>

                    {/* Available Balance Display */}
                    {transferForm.fromCategory && (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm text-gray-600">
                          Available {transferForm.method} balance in {fundCategories.find(f => f.value === transferForm.fromCategory)?.label}: 
                          <span className="font-medium ml-1">
                            {formatCurrency(
                              funds.find(f => f.category === transferForm.fromCategory)?.balance?.[transferForm.method] || 0
                            )}
                          </span>
                        </p>
                        {transferForm.amount && parseFloat(transferForm.amount) > (funds.find(f => f.category === transferForm.fromCategory)?.balance?.[transferForm.method] || 0) && (
                          <p className="text-sm text-red-600 mt-1">
                            ⚠️ Insufficient balance for this transfer
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => {
                        if (transferForm.fromCategory && transferForm.toCategory && transferForm.amount) {
                          transferFunds({
                            ...transferForm,
                            amount: parseFloat(transferForm.amount)
                          });
                        }
                      }}
                      disabled={!transferForm.fromCategory || !transferForm.toCategory || !transferForm.amount || 
                        parseFloat(transferForm.amount) > (funds.find(f => f.category === transferForm.fromCategory)?.balance?.[transferForm.method] || 0)}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-temple-600 to-saffron-500 hover:from-temple-700 hover:to-saffron-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Transfer Funds
                    </button>
                    <button
                      onClick={() => setShowTransferFunds(false)}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500"
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

    </div>
  );
};

export default Funds;