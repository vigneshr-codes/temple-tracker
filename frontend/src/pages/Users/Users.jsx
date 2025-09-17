import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addNotification } from '../../features/ui/uiSlice';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserGroupIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Add User Modal Component
const AddUserModal = ({ onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'volunteer'
  });

  const roleOptions = [
    { 
      value: 'admin', 
      label: 'Administrator',
      description: 'Full access to all modules and user management',
      color: 'text-red-600'
    },
    { 
      value: 'manager', 
      label: 'Manager',
      description: 'Can create/edit donations, expenses, inventory; view funds and reports',
      color: 'text-blue-600'
    },
    { 
      value: 'volunteer', 
      label: 'Volunteer',
      description: 'Can create donations and inventory; limited editing permissions',
      color: 'text-green-600'
    },
    { 
      value: 'viewer', 
      label: 'Viewer',
      description: 'Read-only access to most modules',
      color: 'text-gray-600'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('temple_token');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userForm)
      });

      const data = await response.json();
      
      if (data.success) {
        dispatch(addNotification({
          type: 'success',
          message: 'User created successfully!'
        }));
        onSuccess();
      } else {
        dispatch(addNotification({
          type: 'error',
          message: data.message || 'Failed to create user'
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
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 max-w-2xl shadow-lg rounded-md bg-white">
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add New User</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={userForm.name}
                onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                required
                value={userForm.username}
                onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                placeholder="Choose username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={userForm.email}
                onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                placeholder="user@example.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                minLength="6"
                value={userForm.password}
                onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-temple-500 focus:ring-temple-500 sm:text-sm"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <div className="space-y-2">
                {roleOptions.map(option => (
                  <div key={option.value} className="flex items-start">
                    <input
                      type="radio"
                      id={option.value}
                      name="role"
                      value={option.value}
                      checked={userForm.role === option.value}
                      onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                      className="mt-1 h-4 w-4 text-temple-600 focus:ring-temple-500 border-gray-300"
                    />
                    <div className="ml-3">
                      <label htmlFor={option.value} className="flex items-center cursor-pointer">
                        <span className={`font-medium ${option.color}`}>{option.label}</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

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
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Users = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filters, setFilters] = useState({
    role: '',
    isActive: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  const roleOptions = [
    { value: 'admin', label: 'Administrator', icon: ShieldCheckIcon, color: 'text-red-600 bg-red-100' },
    { value: 'manager', label: 'Manager', icon: UserCircleIcon, color: 'text-blue-600 bg-blue-100' },
    { value: 'volunteer', label: 'Volunteer', icon: UserGroupIcon, color: 'text-green-600 bg-green-100' },
    { value: 'viewer', label: 'Viewer', icon: EyeIcon, color: 'text-gray-600 bg-gray-100' }
  ];

  useEffect(() => {
    fetchUsers();
  }, [filters, pagination.current]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('temple_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const queryParams = new URLSearchParams({
        page: pagination.current.toString(),
        limit: '10'
      });

      if (filters.role) queryParams.append('role', filters.role);
      if (filters.isActive !== '') queryParams.append('isActive', filters.isActive);

      const response = await fetch(`/api/users?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        let filteredUsers = data.data;
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredUsers = data.data.filter(user =>
            user.name.toLowerCase().includes(searchLower) ||
            user.username.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
          );
        }

        setUsers(filteredUsers);
        setPagination(data.pagination);
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      role: '',
      isActive: '',
      search: ''
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getRoleConfig = (role) => {
    return roleOptions.find(opt => opt.value === role) || roleOptions[3];
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const handleEditUser = (user) => {
    // TODO: Implement edit user modal
    console.log('Edit user:', user);
    dispatch(addNotification({
      type: 'info',
      message: 'Edit user functionality coming soon!'
    }));
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Are you sure you want to deactivate user "${user.name}"?`)) {
      try {
        const token = localStorage.getItem('temple_token');
        const response = await fetch(`/api/users/${user._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        
        if (data.success) {
          dispatch(addNotification({
            type: 'success',
            message: 'User deactivated successfully!'
          }));
          fetchUsers(); // Refresh the user list
        } else {
          dispatch(addNotification({
            type: 'error',
            message: data.message || 'Failed to deactivate user'
          }));
        }
      } catch (error) {
        dispatch(addNotification({
          type: 'error',
          message: 'Network error occurred'
        }));
      }
    }
  };

  const handleActivateUser = async (user) => {
    if (window.confirm(`Are you sure you want to activate user "${user.name}"?`)) {
      try {
        const token = localStorage.getItem('temple_token');
        const response = await fetch(`/api/users/${user._id}/activate`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        
        if (data.success) {
          dispatch(addNotification({
            type: 'success',
            message: 'User activated successfully!'
          }));
          fetchUsers(); // Refresh the user list
        } else {
          dispatch(addNotification({
            type: 'error',
            message: data.message || 'Failed to activate user'
          }));
        }
      } catch (error) {
        dispatch(addNotification({
          type: 'error',
          message: 'Network error occurred'
        }));
      }
    }
  };

  // Check if current user has permission to manage users
  const canManageUsers = currentUser?.role === 'admin';

  if (!canManageUsers) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to view user management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create and manage user accounts with role-based permissions
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-temple-600 to-saffron-500 hover:from-temple-700 hover:to-saffron-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add User
          </button>
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
            {(filters.role || filters.isActive !== '' || filters.search) && (
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-temple-500 focus:border-temple-500"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-temple-500 focus:border-temple-500"
              >
                <option value="">All Roles</option>
                {roleOptions.map(option => (
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
                value={filters.isActive}
                onChange={(e) => handleFilterChange('isActive', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-temple-500 focus:border-temple-500"
              >
                <option value="">All Statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
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

      {/* Users List */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Users ({pagination.total})
          </h3>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-temple-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-6 text-center">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {Object.values(filters).some(v => v) ? 'Try adjusting your filters.' : 'Get started by adding a new user.'}
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
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => {
                      const roleConfig = getRoleConfig(user.role);
                      const RoleIcon = roleConfig.icon;
                      
                      return (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-temple-500 to-saffron-500 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {user.name?.charAt(0)}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  @{user.username} • {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleConfig.color}`}>
                              <RoleIcon className="w-3 h-3 mr-1" />
                              {roleConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? (
                                <>
                                  <CheckCircleIcon className="w-3 h-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <XCircleIcon className="w-3 h-3 mr-1" />
                                  Inactive
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(user.createdAt)}
                            {user.createdBy && (
                              <div className="text-xs text-gray-400">
                                by {user.createdBy.name}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewDetails(user)}
                                className="text-temple-600 hover:text-temple-900"
                                title="View Details"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              {currentUser._id !== user._id && (
                                <>
                                  <button
                                    onClick={() => handleEditUser(user)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Edit User"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  {user.isActive ? (
                                    <button
                                      onClick={() => handleDeleteUser(user)}
                                      className="text-red-600 hover:text-red-900"
                                      title="Deactivate User"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleActivateUser(user)}
                                      className="text-green-600 hover:text-green-900"
                                      title="Activate User"
                                    >
                                      <ArrowPathIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                </>
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

      {/* Add User Modal */}
      {showAddModal && <AddUserModal onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); fetchUsers(); }} />}

      {/* User Details Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">User Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Profile */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-temple-500 to-saffron-500 flex items-center justify-center">
                    <span className="text-xl font-medium text-white">
                      {selectedUser.name?.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-xl font-semibold text-gray-900">{selectedUser.name}</h4>
                    <p className="text-sm text-gray-500">@{selectedUser.username}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleConfig(selectedUser.role).color}`}>
                      {(() => {
                        const roleConfig = getRoleConfig(selectedUser.role);
                        const RoleIcon = roleConfig.icon;
                        return <><RoleIcon className="w-3 h-3 mr-1" />{roleConfig.label}</>;
                      })()}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedUser.isActive ? (
                        <>
                          <CheckCircleIcon className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="w-3 h-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Created</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedUser.createdAt)}</p>
                    {selectedUser.createdBy && (
                      <p className="text-xs text-gray-500">Created by {selectedUser.createdBy.name}</p>
                    )}
                  </div>
                  {selectedUser.lastLogin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Login</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedUser.lastLogin)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Permissions */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Permissions Overview</h4>
                <div className="space-y-4">
                  {(() => {
                    // If admin, show all permissions as true
                    if (selectedUser.role === 'admin') {
                      const adminPermissions = {
                        donations: { create: true, read: true, update: true, delete: true },
                        inventory: { create: true, read: true, update: true, delete: true },
                        expenses: { create: true, read: true, update: true, delete: true },
                        funds: { create: true, read: true, update: true, delete: true, allocate: true },
                        users: { create: true, read: true, update: true, delete: true },
                        reports: { read: true, export: true }
                      };
                      
                      return Object.entries(adminPermissions).map(([module, perms]) => (
                        <div key={module} className="bg-white rounded-lg p-4 border">
                          <h5 className="font-medium text-gray-900 capitalize mb-2">{module.replace('-', ' ')}</h5>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(perms).map(([action, allowed]) => (
                              <div key={action} className="flex items-center">
                                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${allowed ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                <span className="capitalize">{action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    }
                    
                    // For other users, use their actual permissions or show default based on role
                    const userPermissions = selectedUser.permissions || (() => {
                      const defaultPerms = {
                        manager: {
                          donations: { create: true, read: true, update: true, delete: false },
                          inventory: { create: true, read: true, update: true, delete: false },
                          expenses: { create: true, read: true, update: true, delete: false },
                          funds: { create: false, read: true, update: false, delete: false, allocate: false },
                          users: { create: false, read: true, update: false, delete: false },
                          reports: { read: true, export: true }
                        },
                        volunteer: {
                          donations: { create: true, read: true, update: false, delete: false },
                          inventory: { create: true, read: true, update: true, delete: false },
                          expenses: { create: true, read: true, update: false, delete: false },
                          funds: { create: false, read: true, update: false, delete: false, allocate: false },
                          users: { create: false, read: false, update: false, delete: false },
                          reports: { read: true, export: false }
                        },
                        viewer: {
                          donations: { create: false, read: true, update: false, delete: false },
                          inventory: { create: false, read: true, update: false, delete: false },
                          expenses: { create: false, read: true, update: false, delete: false },
                          funds: { create: false, read: true, update: false, delete: false, allocate: false },
                          users: { create: false, read: false, update: false, delete: false },
                          reports: { read: true, export: false }
                        }
                      };
                      return defaultPerms[selectedUser.role] || defaultPerms.viewer;
                    })();
                    
                    return Object.entries(userPermissions).map(([module, perms]) => (
                      <div key={module} className="bg-white rounded-lg p-4 border">
                        <h5 className="font-medium text-gray-900 capitalize mb-2">{module.replace('-', ' ')}</h5>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {Object.entries(perms).map(([action, allowed]) => (
                            <div key={action} className="flex items-center">
                              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${allowed ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              <span className="capitalize">{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                {/* Role Description */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded p-3">
                  <h5 className="font-medium text-blue-900 mb-2">Role Description</h5>
                  <p className="text-sm text-blue-800">
                    {(() => {
                      switch(selectedUser.role) {
                        case 'admin':
                          return 'Full access to all modules and user management. Can perform all operations including fund allocation and user creation.';
                        case 'manager':
                          return 'Can create and edit donations, expenses, inventory. Can view funds and generate reports. Cannot delete records or manage users.';
                        case 'volunteer':
                          return 'Can create donations and inventory items. Can update inventory usage. Can create expense requests. Limited editing permissions.';
                        case 'viewer':
                          return 'Read-only access to most modules. Can view donations, inventory, expenses, funds and basic reports. Cannot create, edit, or delete anything.';
                        default:
                          return 'Custom role with specific permissions.';
                      }
                    })()}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;