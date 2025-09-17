import { useState, useEffect, Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dialog, Transition } from '@headlessui/react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  QrCodeIcon,
  MinusIcon,
  ClockIcon,
  TagIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { getInventory, useInventoryItem, getExpiringItems, reset } from '../../features/inventory/inventorySlice';
import { addNotification } from '../../features/ui/uiSlice';
import { hasPermission, canAccessModule } from '../../utils/permissions';

const Inventory = () => {
  const dispatch = useDispatch();
  const { inventory, isLoading, isError, message, expiringItems } = useSelector(
    (state) => state.inventory
  );
  const { user: currentUser } = useSelector((state) => state.auth);

  // Check if user has access to the inventory module
  if (!canAccessModule(currentUser, 'inventory')) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <ArchiveBoxIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to access the inventory module.
          </p>
        </div>
      </div>
    );
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    itemType: '',
    storageLocation: ''
  });
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [usageForm, setUsageForm] = useState({
    quantityUsed: '',
    purpose: '',
    remarks: ''
  });
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [selectedBarcodeItem, setSelectedBarcodeItem] = useState(null);
  const [barcodeLoading, setBarcodeLoading] = useState(false);

  useEffect(() => {
    dispatch(getInventory());
    dispatch(getExpiringItems());
  }, [dispatch]);

  // Handle QR scanner actions
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('item');
    const action = urlParams.get('action');
    
    if (itemId && action && inventory.length > 0) {
      setTimeout(() => {
        const item = inventory.find(inv => inv._id === itemId);
        if (item) {
          if (action === 'use') {
            setSelectedItem(item);
            setIsUsageModalOpen(true);
            dispatch(addNotification({
              type: 'info',
              message: `Opening usage modal for ${item.itemType} - ${item.inventoryId}`
            }));
          } else if (action === 'view') {
            // Scroll to the item or highlight it
            const itemElement = document.getElementById(`item-${itemId}`);
            if (itemElement) {
              itemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              itemElement.classList.add('ring-4', 'ring-temple-300', 'transition-all');
              setTimeout(() => {
                itemElement.classList.remove('ring-4', 'ring-temple-300');
              }, 3000);
            }
            dispatch(addNotification({
              type: 'success',
              message: `Found ${item.itemType} - ${item.inventoryId}`
            }));
          }
        }
        // Clean up URL params
        window.history.replaceState({}, '', window.location.pathname);
      }, 500); // Wait for inventory to load and render
    }
  }, [inventory, dispatch]);

  const generateBarcode = async (item) => {
    try {
      setBarcodeLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:3001/api/inventory/${item._id}/barcode`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSelectedBarcodeItem({
          ...item,
          barcode: {
            data: JSON.stringify(data.data.barcodeData),
            image: data.data.barcodeLabel
          }
        });
        setIsBarcodeModalOpen(true);
        dispatch(addNotification({
          type: 'success',
          message: 'Barcode generated successfully'
        }));
        dispatch(getInventory());
      } else {
        dispatch(addNotification({
          type: 'error',
          message: data.message || 'Failed to generate barcode'
        }));
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to generate barcode'
      }));
    } finally {
      setBarcodeLoading(false);
    }
  };

  const handleBarcodeClick = (item) => {
    if (item.barcode && item.barcode.image) {
      setSelectedBarcodeItem(item);
      setIsBarcodeModalOpen(true);
    } else {
      generateBarcode(item);
    }
  };

  useEffect(() => {
    if (isError) {
      dispatch(addNotification({
        type: 'error',
        message: message
      }));
      dispatch(reset());
    }
  }, [isError, message, dispatch]);

  const handleUseItem = async (e) => {
    e.preventDefault();
    
    if (!selectedItem) return;

    const result = await dispatch(useInventoryItem({
      id: selectedItem._id,
      usageData: {
        quantityUsed: parseFloat(usageForm.quantityUsed),
        purpose: usageForm.purpose,
        remarks: usageForm.remarks
      }
    }));

    if (result.type === 'inventory/useItem/fulfilled') {
      dispatch(addNotification({
        type: 'success',
        message: 'Item usage recorded successfully!'
      }));
      setIsUsageModalOpen(false);
      setSelectedItem(null);
      setUsageForm({ quantityUsed: '', purpose: '', remarks: '' });
      dispatch(getInventory());
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-50';
      case 'used': return 'text-gray-600 bg-gray-50';
      case 'expired': return 'text-red-600 bg-red-50';
      case 'damaged': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return null;
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return { label: 'Expired', color: 'text-red-600' };
    if (daysLeft <= 3) return { label: `${daysLeft}d left`, color: 'text-red-600' };
    if (daysLeft <= 7) return { label: `${daysLeft}d left`, color: 'text-yellow-600' };
    return { label: `${daysLeft}d left`, color: 'text-green-600' };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.itemType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.inventoryId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filters.status || item.status === filters.status;
    const matchesType = !filters.itemType || item.itemType.includes(filters.itemType);
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const openUsageModal = (item) => {
    setSelectedItem(item);
    setIsUsageModalOpen(true);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Inventory Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track and manage donated items with barcode system
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArchiveBoxIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Items
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {inventory.length}
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
                <TagIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Available
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {inventory.filter(item => item.status === 'available').length}
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
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Expiring Soon
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {expiringItems.length}
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
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Expired
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {inventory.filter(item => item.status === 'expired').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expiring Items Alert */}
      {expiringItems.length > 0 && (
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Items Expiring Soon
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  {expiringItems.length} item(s) will expire soon. Please prioritize their usage.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
              placeholder="Search by item type, description, or inventory ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-temple-500 focus:border-temple-500 sm:text-sm rounded-md"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="used">Used</option>
            <option value="expired">Expired</option>
            <option value="damaged">Damaged</option>
          </select>
          
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-temple-500 focus:border-temple-500 sm:text-sm rounded-md"
            value={filters.itemType}
            onChange={(e) => setFilters({...filters, itemType: e.target.value})}
          >
            <option value="">All Types</option>
            <option value="Rice">Rice</option>
            <option value="Oil">Oil</option>
            <option value="Flour">Flour</option>
            <option value="Vegetables">Vegetables</option>
            <option value="Fruits">Fruits</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="mt-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredInventory.map((item) => {
            const expiryStatus = getExpiryStatus(item.expiryDate);
            return (
              <div key={item._id} id={`item-${item._id}`} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ArchiveBoxIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {item.itemType}
                        </h3>
                        <p className="text-sm text-gray-500">
                          ID: {item.inventoryId}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Quantity</dt>
                        <dd className="text-sm text-gray-900">{item.remainingQuantity}/{item.quantity} {item.unit}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Donor</dt>
                        <dd className="text-sm text-gray-900">{item.donor?.name || 'Anonymous'}</dd>
                      </div>
                    </div>
                  </div>

                  {item.description && (
                    <div className="mt-3">
                      <dt className="text-sm font-medium text-gray-500">Description</dt>
                      <dd className="text-sm text-gray-900">{item.description}</dd>
                    </div>
                  )}

                  {item.expiryDate && (
                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Expires</dt>
                        <dd className="text-sm text-gray-900">{formatDate(item.expiryDate)}</dd>
                      </div>
                      {expiryStatus && (
                        <span className={`text-sm font-medium ${expiryStatus.color}`}>
                          {expiryStatus.label}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-4">
                    <dt className="text-sm font-medium text-gray-500">Received</dt>
                    <dd className="text-sm text-gray-900">{formatDate(item.createdAt)}</dd>
                  </div>

                  {item.status === 'available' && item.remainingQuantity > 0 && (
                    <div className="mt-6 flex gap-2">
                      {hasPermission(currentUser, 'inventory', 'update') && (
                        <button
                          onClick={() => openUsageModal(item)}
                          className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-gradient-to-r from-temple-600 to-saffron-500 hover:from-temple-700 hover:to-saffron-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500"
                        >
                          <MinusIcon className="h-4 w-4 mr-1" />
                          Use Item
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleBarcodeClick(item)}
                        disabled={barcodeLoading}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500 disabled:opacity-50"
                      >
                        <QrCodeIcon className="h-4 w-4 mr-1" />
                        {item.barcode ? 'View QR' : 'Generate QR'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredInventory.length === 0 && (
          <div className="text-center py-12">
            <ArchiveBoxIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory items</h3>
            <p className="mt-1 text-sm text-gray-500">
              {inventory.length === 0 
                ? 'No items have been added to inventory yet. In-kind donations will appear here.'
                : 'No items match your search criteria.'}
            </p>
          </div>
        )}
      </div>

      {/* Use Item Modal */}
      <Transition.Root show={isUsageModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setIsUsageModalOpen}>
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
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                  <form onSubmit={handleUseItem}>
                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                      <div className="sm:flex sm:items-start">
                        <div className="w-full">
                          <div className="flex items-center justify-between">
                            <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                              Use Inventory Item
                            </Dialog.Title>
                            <button
                              type="button"
                              onClick={() => setIsUsageModalOpen(false)}
                              className="text-gray-400 hover:text-gray-500"
                            >
                              <XMarkIcon className="h-6 w-6" />
                            </button>
                          </div>

                          {selectedItem && (
                            <div className="mt-6">
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900">{selectedItem.itemType}</h4>
                                <p className="text-sm text-gray-500">
                                  Available: {selectedItem.remainingQuantity} {selectedItem.unit}
                                </p>
                                <p className="text-sm text-gray-500">
                                  From: {selectedItem.donor?.name || 'Anonymous'}
                                </p>
                              </div>

                              <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700">
                                  Quantity to Use *
                                </label>
                                <div className="mt-1 flex rounded-md shadow-sm">
                                  <input
                                    type="number"
                                    required
                                    min="0.1"
                                    max={selectedItem.remainingQuantity}
                                    step="0.1"
                                    value={usageForm.quantityUsed}
                                    onChange={(e) => setUsageForm({...usageForm, quantityUsed: e.target.value})}
                                    className="flex-1 rounded-l-md border-gray-300 focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                                  />
                                  <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                    {selectedItem.unit}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700">
                                  Purpose *
                                </label>
                                <select
                                  required
                                  value={usageForm.purpose}
                                  onChange={(e) => setUsageForm({...usageForm, purpose: e.target.value})}
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                                >
                                  <option value="">Select purpose</option>
                                  <option value="Anadhanam">Anadhanam (Free Food)</option>
                                  <option value="Festival Celebration">Festival Celebration</option>
                                  <option value="Daily Prasadam">Daily Prasadam</option>
                                  <option value="Special Occasion">Special Occasion</option>
                                  <option value="Emergency Relief">Emergency Relief</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>

                              <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700">
                                  Remarks (Optional)
                                </label>
                                <textarea
                                  rows={3}
                                  value={usageForm.remarks}
                                  onChange={(e) => setUsageForm({...usageForm, remarks: e.target.value})}
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                                  placeholder="Additional notes about this usage..."
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-gradient-to-r from-temple-600 to-saffron-500 px-4 py-2 text-base font-medium text-white shadow-sm hover:from-temple-700 hover:to-saffron-600 focus:outline-none focus:ring-2 focus:ring-temple-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                      >
                        {isLoading ? 'Recording...' : 'Record Usage'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsUsageModalOpen(false)}
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

      {/* Barcode Modal */}
      <Transition.Root show={isBarcodeModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setIsBarcodeModalOpen}>
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
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="absolute top-0 right-0 pt-4 pr-4">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={() => setIsBarcodeModalOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="text-center">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                      QR Code - {selectedBarcodeItem?.itemType}
                    </Dialog.Title>
                    
                    {selectedBarcodeItem?.barcode?.image && (
                      <div className="mt-4 flex flex-col items-center">
                        <div 
                          className="bg-white p-4 rounded-lg shadow-inner border-2 border-gray-200 w-full"
                          style={{ 
                            textAlign: 'center', 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            flexDirection: 'column'
                          }}
                        >
                          <style dangerouslySetInnerHTML={{ __html: `
                            .label { 
                              margin: 0 auto !important; 
                              display: inline-block !important;
                            }
                            .qr-code img {
                              width: 100px !important;
                              height: 100px !important;
                            }
                          ` }} />
                          <div dangerouslySetInnerHTML={{ __html: selectedBarcodeItem.barcode.image }} />
                        </div>
                        
                        <div className="mt-4 text-sm text-gray-600 space-y-2">
                          <p><span className="font-medium">Inventory ID:</span> {selectedBarcodeItem.inventoryId}</p>
                          <p><span className="font-medium">Item:</span> {selectedBarcodeItem.itemType}</p>
                          <p><span className="font-medium">Quantity:</span> {selectedBarcodeItem.remainingQuantity} / {selectedBarcodeItem.quantity} {selectedBarcodeItem.unit}</p>
                          {selectedBarcodeItem.donor && (
                            <p><span className="font-medium">Donor:</span> {selectedBarcodeItem.donor.name}</p>
                          )}
                        </div>

                        <div className="mt-6 flex space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              const printWindow = window.open('', '_blank');
                              const barcodeHTML = selectedBarcodeItem.barcode.image;
                              
                              printWindow.document.write(`
                                <!DOCTYPE html>
                                <html>
                                  <head>
                                    <title>QR Code - ${selectedBarcodeItem.inventoryId}</title>
                                    <style>
                                      @media print {
                                        body { margin: 0; }
                                      }
                                      body { 
                                        font-family: Arial, sans-serif; 
                                        text-align: center; 
                                        padding: 20px;
                                        margin: 0;
                                      }
                                      .barcode-container { 
                                        display: inline-block; 
                                        border: 2px solid #000; 
                                        padding: 15px; 
                                        margin: 10px;
                                        background: white;
                                      }
                                      .barcode-container > div {
                                        text-align: center;
                                        display: flex;
                                        flex-direction: column;
                                        align-items: center;
                                      }
                                      .qr-code {
                                        margin: 10px auto;
                                      }
                                      h2 {
                                        margin-top: 0;
                                        color: #333;
                                        font-size: 18px;
                                      }
                                      .item-details {
                                        font-size: 14px;
                                        color: #666;
                                        margin-top: 10px;
                                      }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="barcode-container">
                                      <h2>${selectedBarcodeItem.itemType} - ${selectedBarcodeItem.inventoryId}</h2>
                                      ${barcodeHTML}
                                      <div class="item-details">
                                        <p>Quantity: ${selectedBarcodeItem.remainingQuantity}/${selectedBarcodeItem.quantity} ${selectedBarcodeItem.unit}</p>
                                        ${selectedBarcodeItem.donor ? `<p>Donor: ${selectedBarcodeItem.donor.name}</p>` : ''}
                                        ${selectedBarcodeItem.expiryDate ? `<p>Expires: ${new Date(selectedBarcodeItem.expiryDate).toLocaleDateString()}</p>` : ''}
                                      </div>
                                    </div>
                                  </body>
                                </html>
                              `);
                              printWindow.document.close();
                              setTimeout(() => {
                                printWindow.print();
                                setTimeout(() => printWindow.close(), 1000);
                              }, 500);
                            }}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500"
                          >
                            Print QR Code
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setIsBarcodeModalOpen(false)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-temple-600 to-saffron-500 hover:from-temple-700 hover:to-saffron-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

export default Inventory;