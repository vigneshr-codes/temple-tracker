import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, getMe } from "../../features/auth/authSlice";
import { toggleSidebar } from "../../features/ui/uiSlice";
import { addNotification } from "../../features/ui/uiSlice";
import { HomeIcon, CurrencyDollarIcon, ArchiveBoxIcon, DocumentTextIcon, BanknotesIcon, CalendarDaysIcon, ChartBarIcon, Cog6ToothIcon, UserGroupIcon, Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon, QrCodeIcon } from "@heroicons/react/24/outline";
import { NavLink } from "react-router-dom";
import QRScanner from "../QRScanner/QRScanner";
import { canAccessModule } from "../../utils/permissions";

const navigation = [
  { name: "Dashboard", href: "/", icon: HomeIcon, module: null }, // No permission required for dashboard
  { name: "Donations", href: "/donations", icon: CurrencyDollarIcon, module: "donations" },
  { name: "Inventory", href: "/inventory", icon: ArchiveBoxIcon, module: "inventory" },
  { name: "Expenses", href: "/expenses", icon: DocumentTextIcon, module: "expenses" },
  { name: "Funds", href: "/funds", icon: BanknotesIcon, module: "funds" },
  { name: "Events", href: "/events", icon: CalendarDaysIcon, module: "events" },
  { name: "Reports", href: "/reports", icon: ChartBarIcon, module: "reports" },
  { name: "Settings", href: "/settings", icon: Cog6ToothIcon, module: null } // No permission required for settings
];

const adminNavigation = [{ name: "Users", href: "/users", icon: UserGroupIcon, module: "users" }];

const Layout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { sidebarOpen } = useSelector(state => state.ui);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const toggleSidebarHandler = () => {
    dispatch(toggleSidebar());
  };

  // eslint-disable-next-line no-unused-vars
  const handleQRScanSuccess = (item, scannedData) => {
    dispatch(
      addNotification({
        type: "success",
        message: `Successfully scanned ${item.itemType} - ${item.inventoryId}`
      })
    );
  };

  const handleQRScanError = error => {
    dispatch(
      addNotification({
        type: "error",
        message: error || "Failed to scan QR code"
      })
    );
  };

  // Fetch updated user data on component mount to ensure latest permissions
  useEffect(() => {
    if (user) {
      dispatch(getMe());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, user?.id]);

  // Debug logging
  console.log("Layout Debug - User object:", user);
  console.log("Layout Debug - User permissions:", user?.permissions);
  console.log("Layout Debug - User role:", user?.role);

  // Filter navigation based on user permissions
  const filteredNavigation = navigation.filter(item => {
    const hasAccess = !item.module || canAccessModule(user, item.module);
    console.log(`Layout Debug - ${item.name} (${item.module}): ${hasAccess}`);
    return hasAccess;
  });

  const filteredAdminNavigation = user?.role === "admin" ? adminNavigation.filter(item => !item.module || canAccessModule(user, item.module)) : [];

  const allNavigation = [...filteredNavigation, ...filteredAdminNavigation];
  console.log(
    "Layout Debug - Final navigation items:",
    allNavigation.map(n => n.name)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu */}
      <div className={`fixed inset-0 flex z-40 lg:hidden ${sidebarOpen ? "" : "hidden"}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={toggleSidebarHandler}></div>

        <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button type="button" className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" onClick={toggleSidebarHandler}>
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>

          <div className="flex-shrink-0 flex items-center px-4">
            <div className="h-10 w-10 bg-gradient-to-br from-saffron-500 to-temple-500 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="ml-2 text-xl font-bold text-gray-900">Temple Tracker</span>
          </div>

          <div className="mt-5 flex-1 h-0 overflow-y-auto">
            <nav className="px-2 space-y-1">
              {allNavigation.map(item => (
                <NavLink key={item.name} to={item.href} className={({ isActive }) => `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive ? "bg-gradient-to-r from-temple-100 to-saffron-50 text-temple-700 border-r-2 border-temple-500" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                  <item.icon className="mr-3 flex-shrink-0 h-6 w-6" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white pt-5 pb-4 overflow-y-auto border-r border-gray-200">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="h-10 w-10 bg-gradient-to-br from-saffron-500 to-temple-500 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="ml-2 text-xl font-bold text-gray-900">Temple Tracker</span>
          </div>

          <div className="mt-8 flex-1 flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {allNavigation.map(item => (
                <NavLink key={item.name} to={item.href} className={({ isActive }) => `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? "bg-gradient-to-r from-temple-100 to-saffron-50 text-temple-700 border-r-2 border-temple-500" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                  <item.icon className="mr-3 flex-shrink-0 h-6 w-6" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow border-b border-gray-200 lg:border-none">
          <button type="button" className="px-4 border-r border-gray-200 text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-temple-500 lg:hidden" onClick={toggleSidebarHandler}>
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-gray-900 hidden lg:block">Welcome back, {user?.name}</h1>
            </div>

            <div className="ml-4 flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gradient-to-br from-saffron-500 to-temple-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">{user?.name?.charAt(0)}</span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>

              <button onClick={handleLogout} className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500 transition-colors">
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating QR Scanner Button */}
      <button onClick={() => setIsQRScannerOpen(true)} className="fixed bottom-6 right-6 z-30 bg-gradient-to-r from-temple-600 to-saffron-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-temple-300 group" title="Scan QR Code">
        <QrCodeIcon className="h-6 w-6" />
        <div className="absolute -top-2 -left-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
          </svg>
        </div>
      </button>

      {/* QR Scanner Modal */}
      <QRScanner isOpen={isQRScannerOpen} onClose={() => setIsQRScannerOpen(false)} onScanSuccess={handleQRScanSuccess} onScanError={handleQRScanError} />
    </div>
  );
};

export default Layout;
