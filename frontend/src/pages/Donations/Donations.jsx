import { useState, useEffect, Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dialog, Transition } from '@headlessui/react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  ArchiveBoxIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { getDonations, createDonation, reset } from '../../features/donations/donationSlice';
import { addNotification } from '../../features/ui/uiSlice';
import { hasPermission, canAccessModule } from '../../utils/permissions';

const Donations = () => {
  const dispatch = useDispatch();
  const { donations, isLoading, isError, message, totalAmount } = useSelector(
    (state) => state.donations
  );
  const { user: currentUser } = useSelector((state) => state.auth);

  // Check if user can access donations module
  if (!canAccessModule(currentUser, 'donations')) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to view donations.
          </p>
        </div>
      </div>
    );
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDonationType, setSelectedDonationType] = useState('cash');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
    event: ''
  });

  const [donationForm, setDonationForm] = useState({
    type: 'cash',
    donor: {
      name: '',
      mobile: '',
      email: '',
      address: ''
    },
    amount: '',
    upiTransactionId: '',
    event: 'general',
    isAnonymous: false,
    notes: '',
    items: []
  });

  const [inKindItem, setInKindItem] = useState({
    itemType: '',
    description: '',
    quantity: '',
    unit: 'kg',
    expiryDate: '',
    storageInstructions: ''
  });

  useEffect(() => {
    dispatch(getDonations());
  }, [dispatch]);

  useEffect(() => {
    if (isError) {
      dispatch(addNotification({
        type: 'error',
        message: message
      }));
      dispatch(reset());
    }
  }, [isError, message, dispatch]);

  const handleCreateDonation = async (e) => {
    e.preventDefault();
    
    const donationData = {
      ...donationForm,
      amount: donationForm.type !== 'in-kind' ? parseFloat(donationForm.amount) : 0
    };

    // Fix UPI transaction ID structure for backend validation
    if (donationForm.type === 'upi' && donationForm.upiTransactionId) {
      donationData.upiDetails = {
        transactionId: donationForm.upiTransactionId
      };
      delete donationData.upiTransactionId;
    }

    const result = await dispatch(createDonation(donationData));
    
    if (result.type === 'donations/create/fulfilled') {
      dispatch(addNotification({
        type: 'success',
        message: `${donationForm.type.charAt(0).toUpperCase() + donationForm.type.slice(1)} donation recorded successfully!`
      }));
      setIsModalOpen(false);
      resetForm();
      dispatch(getDonations());
    }
  };

  const resetForm = () => {
    setDonationForm({
      type: 'cash',
      donor: {
        name: '',
        mobile: '',
        email: '',
        address: ''
      },
      amount: '',
      upiTransactionId: '',
      event: 'general',
      isAnonymous: false,
      notes: '',
      items: []
    });
    setInKindItem({
      itemType: '',
      description: '',
      quantity: '',
      unit: 'kg',
      expiryDate: '',
      storageInstructions: ''
    });
  };

  const addInKindItem = () => {
    if (!inKindItem.itemType || !inKindItem.quantity) {
      dispatch(addNotification({
        type: 'error',
        message: 'Item type and quantity are required'
      }));
      return;
    }

    setDonationForm(prev => ({
      ...prev,
      items: [...prev.items, { ...inKindItem, quantity: parseFloat(inKindItem.quantity) }]
    }));

    setInKindItem({
      itemType: '',
      description: '',
      quantity: '',
      unit: 'kg',
      expiryDate: '',
      storageInstructions: ''
    });
  };

  const removeInKindItem = (index) => {
    setDonationForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const getDonationIcon = (type) => {
    switch (type) {
      case 'cash': return CurrencyDollarIcon;
      case 'upi': return CreditCardIcon;
      case 'in-kind': return ArchiveBoxIcon;
      default: return CurrencyDollarIcon;
    }
  };

  const getDonationColor = (type) => {
    switch (type) {
      case 'cash': return 'text-green-600 bg-green-50';
      case 'upi': return 'text-blue-600 bg-blue-50';
      case 'in-kind': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredDonations = donations.filter(donation => {
    const matchesSearch = donation.donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donation.donationId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filters.type || donation.type === filters.type;
    const matchesEvent = !filters.event || donation.event === filters.event;
    
    return matchesSearch && matchesType && matchesEvent;
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Donations</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage cash, UPI, and in-kind donations to the temple
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          {hasPermission(currentUser, 'donations', 'create') && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-gradient-to-r from-temple-600 to-saffron-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-temple-700 hover:to-saffron-600 focus:outline-none focus:ring-2 focus:ring-temple-500 focus:ring-offset-2 transition-all"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Donation
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
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Amount
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ₹{totalAmount?.toLocaleString('en-IN') || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PaperAirplaneIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Donations
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {donations.length}
                  </dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    UPI Donations
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {donations.filter(d => d.type === 'upi').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArchiveBoxIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    In-Kind Items
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {donations.filter(d => d.type === 'in-kind').reduce((acc, d) => acc + d.items.length, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-temple-500 focus:border-temple-500 sm:text-sm"
              placeholder="Search by donor name or donation ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-temple-500 focus:border-temple-500 sm:text-sm rounded-md"
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
          >
            <option value="">All Types</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="in-kind">In-Kind</option>
          </select>
        </div>
      </div>

      {/* Donations List */}
      <div className="mt-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredDonations.map((donation) => {
              const IconComponent = getDonationIcon(donation.type);
              return (
                <li key={donation._id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 p-2 rounded-full ${getDonationColor(donation.type)}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {donation.donor.name}
                          </p>
                          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 capitalize">
                            {donation.type}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <p>ID: {donation.donationId}</p>
                          <span className="mx-2">•</span>
                          <p>{formatDate(donation.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {donation.type === 'in-kind' 
                          ? `${donation.items.length} items` 
                          : `₹${donation.amount?.toLocaleString('en-IN')}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {donation.event !== 'general' ? donation.event : 'General'}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
            {filteredDonations.length === 0 && (
              <li className="px-4 py-12 text-center">
                <div className="text-sm text-gray-500">
                  {donations.length === 0 ? 'No donations recorded yet' : 'No donations match your search criteria'}
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Add Donation Modal */}
      <Transition.Root show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setIsModalOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                  <form onSubmit={handleCreateDonation}>
                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                      <div className="sm:flex sm:items-start">
                        <div className="w-full">
                          <div className="flex items-center justify-between">
                            <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                              Add New Donation
                            </Dialog.Title>
                            <button
                              type="button"
                              onClick={() => setIsModalOpen(false)}
                              className="text-gray-400 hover:text-gray-500"
                            >
                              <XMarkIcon className="h-6 w-6" />
                            </button>
                          </div>

                          {/* Donation Type Selection */}
                          <div className="mt-6">
                            <label className="text-sm font-medium text-gray-900">Donation Type</label>
                            <div className="mt-2 grid grid-cols-3 gap-3">
                              {['cash', 'upi', 'in-kind'].map((type) => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => setDonationForm({...donationForm, type})}
                                  className={`p-3 border rounded-lg text-center transition-colors ${
                                    donationForm.type === type
                                      ? 'border-temple-500 bg-temple-50 text-temple-700'
                                      : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                >
                                  <div className="flex flex-col items-center">
                                    {type === 'cash' && <CurrencyDollarIcon className="h-6 w-6 mb-1" />}
                                    {type === 'upi' && <CreditCardIcon className="h-6 w-6 mb-1" />}
                                    {type === 'in-kind' && <ArchiveBoxIcon className="h-6 w-6 mb-1" />}
                                    <span className="text-sm font-medium capitalize">{type}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Donor Information */}
                          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Donor Name *
                              </label>
                              <input
                                type="text"
                                required
                                value={donationForm.donor.name}
                                onChange={(e) => setDonationForm({
                                  ...donationForm,
                                  donor: {...donationForm.donor, name: e.target.value}
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Mobile Number *
                              </label>
                              <input
                                type="tel"
                                required
                                value={donationForm.donor.mobile}
                                onChange={(e) => setDonationForm({
                                  ...donationForm,
                                  donor: {...donationForm.donor, mobile: e.target.value}
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                              />
                            </div>
                          </div>

                          {/* Amount for Cash/UPI */}
                          {donationForm.type !== 'in-kind' && (
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700">
                                Amount *
                              </label>
                              <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <span className="text-gray-500 sm:text-sm">₹</span>
                                </div>
                                <input
                                  type="number"
                                  required
                                  min="1"
                                  value={donationForm.amount}
                                  onChange={(e) => setDonationForm({...donationForm, amount: e.target.value})}
                                  className="block w-full pl-7 pr-12 rounded-md border-gray-300 focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                                />
                              </div>
                            </div>
                          )}

                          {/* UPI Transaction ID */}
                          {donationForm.type === 'upi' && (
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700">
                                UPI Transaction ID
                              </label>
                              <input
                                type="text"
                                value={donationForm.upiTransactionId}
                                onChange={(e) => setDonationForm({...donationForm, upiTransactionId: e.target.value})}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                              />
                            </div>
                          )}

                          {/* In-Kind Items */}
                          {donationForm.type === 'in-kind' && (
                            <div className="mt-6">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-900">Items</label>
                              </div>
                              
                              {/* Add Item Form */}
                              <div className="mt-2 p-4 border border-gray-200 rounded-lg">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                  <div>
                                    <input
                                      type="text"
                                      placeholder="Item Type (e.g., Rice, Oil)"
                                      value={inKindItem.itemType}
                                      onChange={(e) => setInKindItem({...inKindItem, itemType: e.target.value})}
                                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                                    />
                                  </div>
                                  <div className="flex">
                                    <input
                                      type="number"
                                      placeholder="Quantity"
                                      min="0.1"
                                      step="0.1"
                                      value={inKindItem.quantity}
                                      onChange={(e) => setInKindItem({...inKindItem, quantity: e.target.value})}
                                      className="block w-full rounded-l-md border-gray-300 focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                                    />
                                    <select
                                      value={inKindItem.unit}
                                      onChange={(e) => setInKindItem({...inKindItem, unit: e.target.value})}
                                      className="border-l-0 border-gray-300 rounded-r-md focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                                    >
                                      <option value="kg">kg</option>
                                      <option value="liters">liters</option>
                                      <option value="pieces">pieces</option>
                                      <option value="packets">packets</option>
                                      <option value="bags">bags</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="mt-2">
                                  <input
                                    type="text"
                                    placeholder="Description (optional)"
                                    value={inKindItem.description}
                                    onChange={(e) => setInKindItem({...inKindItem, description: e.target.value})}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={addInKindItem}
                                  className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-temple-700 bg-temple-100 hover:bg-temple-200"
                                >
                                  <PlusIcon className="h-4 w-4 mr-1" />
                                  Add Item
                                </button>
                              </div>

                              {/* Items List */}
                              {donationForm.items.length > 0 && (
                                <div className="mt-3">
                                  <ul className="divide-y divide-gray-200">
                                    {donationForm.items.map((item, index) => (
                                      <li key={index} className="py-2 flex justify-between items-center">
                                        <span className="text-sm">
                                          {item.quantity} {item.unit} {item.itemType}
                                          {item.description && ` - ${item.description}`}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => removeInKindItem(index)}
                                          className="text-red-600 hover:text-red-800"
                                        >
                                          <XMarkIcon className="h-4 w-4" />
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Event Selection */}
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700">
                              Event/Purpose
                            </label>
                            <select
                              value={donationForm.event}
                              onChange={(e) => setDonationForm({...donationForm, event: e.target.value})}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                            >
                              <option value="general">General Donation</option>
                              <option value="diwali">Diwali</option>
                              <option value="janmashtami">Janmashtami</option>
                              <option value="navratri">Navratri</option>
                              <option value="holi">Holi</option>
                              <option value="anadhanam">Anadhanam</option>
                            </select>
                          </div>

                          {/* Notes */}
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700">
                              Notes (Optional)
                            </label>
                            <textarea
                              rows={3}
                              value={donationForm.notes}
                              onChange={(e) => setDonationForm({...donationForm, notes: e.target.value})}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-gradient-to-r from-temple-600 to-saffron-500 px-4 py-2 text-base font-medium text-white shadow-sm hover:from-temple-700 hover:to-saffron-600 focus:outline-none focus:ring-2 focus:ring-temple-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                      >
                        {isLoading ? 'Recording...' : 'Record Donation'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

export default Donations;