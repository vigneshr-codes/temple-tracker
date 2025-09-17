import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CurrencyDollarIcon,
  ArchiveBoxIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ChartBarSquareIcon,
} from '@heroicons/react/24/outline';
import { getDonations } from '../../features/donations/donationSlice';
import { getEvents } from '../../features/events/eventSlice';
import { canAccessModule } from '../../utils/permissions';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { donations, totalAmount } = useSelector((state) => state.donations);
  const { events } = useSelector((state) => state.events);

  useEffect(() => {
    dispatch(getDonations());
    if (canAccessModule(user, 'events')) {
      dispatch(getEvents());
    }
  }, [dispatch, user]);

  const stats = [
    {
      name: 'Total Donations',
      value: `₹${totalAmount?.toLocaleString('en-IN') || 0}`,
      change: `+${donations.length} donations`,
      changeType: 'increase',
      icon: CurrencyDollarIcon,
      href: '/donations',
      module: 'donations'
    },
    {
      name: 'Inventory Items',
      value: `${donations.filter(d => d.type === 'in-kind').reduce((acc, d) => acc + (d.items?.length || 0), 0)}`,
      change: `+${donations.filter(d => d.type === 'in-kind').length} donations`,
      changeType: 'increase',
      icon: ArchiveBoxIcon,
      href: '/inventory',
      module: 'inventory'
    },
    {
      name: 'Total Expenses',
      value: '₹0',
      change: '+0%',
      changeType: 'increase',
      icon: DocumentTextIcon,
      href: '/expenses',
      module: 'expenses'
    },
    {
      name: 'Active Events',
      value: `${events.filter(e => e.status === 'upcoming' || e.status === 'ongoing').length}`,
      change: `+${events.length} total`,
      changeType: 'increase',
      icon: CalendarDaysIcon,
      href: '/events',
      module: 'events'
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'info',
      message: 'Welcome to Temple Tracker! Start by adding your first donation.',
      time: 'Just now',
    }
  ];

  const quickActions = [
    {
      name: 'Add Donation',
      description: 'Record a new cash, UPI, or in-kind donation',
      href: '/donations',
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
      module: 'donations',
      permission: 'create'
    },
    {
      name: 'Manage Inventory',
      description: 'View and manage donated items',
      href: '/inventory',
      icon: ArchiveBoxIcon,
      color: 'bg-blue-500',
      module: 'inventory',
      permission: 'read'
    },
    {
      name: 'Add Expense',
      description: 'Record temple expenses',
      href: '/expenses',
      icon: DocumentTextIcon,
      color: 'bg-red-500',
      module: 'expenses',
      permission: 'create'
    },
    {
      name: 'Create Event',
      description: 'Plan temple festivals and events',
      href: '/events',
      icon: CalendarDaysIcon,
      color: 'bg-purple-500',
      module: 'events',
      permission: 'create'
    },
  ];

  // Filter stats and quick actions based on permissions
  const filteredStats = stats.filter(stat => canAccessModule(user, stat.module));
  const filteredQuickActions = quickActions.filter(action => {
    // Import hasPermission for more granular permission checks
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions?.[action.module]?.[action.permission] === true;
  });

  // Handle navigation with permission checks
  const handleNavigation = (href, module, requiredPermission = 'read') => {
    if (!canAccessModule(user, module)) {
      alert('You do not have permission to access this module.');
      return;
    }
    
    if (requiredPermission !== 'read' && user.role !== 'admin') {
      const hasSpecificPermission = user.permissions?.[module]?.[requiredPermission] === true;
      if (!hasSpecificPermission) {
        alert(`You do not have ${requiredPermission} permission for this module.`);
        return;
      }
    }
    
    navigate(href);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Overview of temple donations, expenses, and activities
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <span className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-temple-700 bg-temple-100">
            {user?.role === 'admin' ? 'Administrator' : 'Staff Member'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filteredStats.map((item) => (
            <div
              key={item.name}
              className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => handleNavigation(item.href, item.module)}
            >
              <div>
                <div className="absolute bg-gradient-to-r from-temple-500 to-saffron-500 rounded-md p-3 group-hover:scale-110 transition-transform">
                  <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                  {item.name}
                </p>
              </div>
              <div className="ml-16 flex items-baseline pb-6 sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
                <p
                  className={`ml-2 flex items-baseline text-sm font-semibold ${
                    item.changeType === 'increase'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {item.change}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="bg-white shadow rounded-lg">
            <ul className="divide-y divide-gray-200">
              {filteredQuickActions.map((action) => (
                <li key={action.name}>
                  <div
                    className="block hover:bg-gray-50 p-4 transition-colors cursor-pointer"
                    onClick={() => handleNavigation(action.href, action.module, action.permission)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`flex-shrink-0 p-2 ${action.color} rounded-md`}>
                        <action.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{action.name}</p>
                        <p className="text-sm text-gray-500">{action.description}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          <div className="bg-white shadow rounded-lg">
            <ul className="divide-y divide-gray-200">
              {recentActivities.map((activity) => (
                <li key={activity.id} className="p-4">
                  <div className="flex space-x-3">
                    <div
                      className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                        activity.type === 'success'
                          ? 'bg-green-400'
                          : activity.type === 'warning'
                          ? 'bg-yellow-400'
                          : activity.type === 'error'
                          ? 'bg-red-400'
                          : 'bg-blue-400'
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="mt-8">
        <div className="bg-gradient-to-r from-temple-50 to-saffron-50 border border-temple-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarSquareIcon className="h-8 w-8 text-temple-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-temple-900">
                Welcome to Temple Tracker
              </h3>
              <p className="text-sm text-temple-700 mt-1">
                Your comprehensive solution for managing temple donations, inventory, expenses, and events. 
                Start by exploring the navigation menu to access all features.
              </p>
              <div className="mt-4">
                <span className="inline-flex items-center text-sm font-medium text-temple-600">
                  🕉️ Om Namah Shivaya 🙏
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;