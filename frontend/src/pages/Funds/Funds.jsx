import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addNotification } from '../../features/ui/uiSlice';
import { hasPermission, canAccessModule } from '../../utils/permissions';
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
  BuildingLibraryIcon
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
  const [showAllocateExpense, setShowAllocateExpense] = useState(false);
  const [showTransferFunds, setShowTransferFunds] = useState(false);
  const [pendingDonations, setPendingDonations] = useState([]);
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [totalBalances, setTotalBalances] = useState({ cash: 0, upi: 0, total: 0 });

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

      const token = localStorage.getItem('temple_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('/api/funds', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
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
      const token = localStorage.getItem('temple_token');
      const response = await fetch('/api/donations?status=received&type=cash,upi', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setPendingDonations(data.data.filter(d => d.type === 'cash' || d.type === 'upi'));
      }
    } catch (error) {
      console.error('Error fetching pending donations:', error);
    }
  };

  const fetchPendingExpenses = async () => {
    try {
      const token = localStorage.getItem('temple_token');
      const response = await fetch('/api/expenses?status=approved', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setPendingExpenses(data.data);
      }
    } catch (error) {
      console.error('Error fetching pending expenses:', error);
    }
  };

  const processDonation = async (donationId, fundCategory = 'general') => {
    try {
      console.log('Processing donation:', donationId, 'Category:', fundCategory);
      const token = localStorage.getItem('temple_token');
      console.log('Token exists:', !!token);
      
      const response = await fetch(`/api/funds/process-donation/${donationId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fundCategory })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        setShowProcessDonation(false);
        fetchFunds();
        fetchPendingDonations();
        showNotification(`Successfully processed donation into ${fundCategory} fund`, 'success');
      } else {
        showNotification(data.message || 'Failed to process donation', 'error');
      }
    } catch (error) {
      console.error('Error processing donation:', error);
      showNotification('Failed to process donation: ' + error.message, 'error');
    }
  };

  const allocateExpense = async (expenseId, fundCategory = 'general', paymentMethod = 'cash') => {
    try {
      const token = localStorage.getItem('temple_token');
      const response = await fetch(`/api/funds/allocate-expense/${expenseId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fundCategory, paymentMethod })
      });

      const data = await response.json();
      if (data.success) {
        setShowAllocateExpense(false);
        fetchFunds();
        fetchPendingExpenses();
        showNotification(`Successfully allocated expense from ${fundCategory} fund`, 'success');
      } else {
        showNotification(data.message || 'Failed to allocate expense', 'error');
      }
    } catch (error) {
      console.error('Error allocating expense:', error);
      showNotification('Failed to allocate expense', 'error');
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
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Process Donations</h3>
              <div className="space-y-3">
                {pendingDonations.length > 0 ? (
                  pendingDonations.map((donation) => (
                    <div key={donation._id} className="flex justify-between items-center p-3 border rounded">
                      <div className="text-left">
                        <p className="font-medium">{donation.donor.name}</p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(donation.amount)} - {donation.type}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(donation.createdAt)}</p>
                      </div>
                      <div className="space-x-2">
                        <select
                          onChange={(e) => processDonation(donation._id, e.target.value)}
                          className="text-sm border rounded p-1"
                          defaultValue=""
                        >
                          <option value="">Select Fund</option>
                          {fundCategories.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No pending donations to process</p>
                )}
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setShowProcessDonation(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
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

    </div>
  );
};

export default Funds;