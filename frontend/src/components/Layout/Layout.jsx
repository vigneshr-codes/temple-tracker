import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { logout, getMe } from "../../features/auth/authSlice";
import { toggleSidebar } from "../../features/ui/uiSlice";
import { addNotification } from "../../features/ui/uiSlice";
import { HomeIcon, CurrencyDollarIcon, ArchiveBoxIcon, DocumentTextIcon, BanknotesIcon, CalendarDaysIcon, ChartBarIcon, Cog6ToothIcon, UserGroupIcon, Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon, QrCodeIcon } from "@heroicons/react/24/outline";
import { NavLink } from "react-router-dom";
import QRScanner from "../QRScanner/QRScanner";
import LanguageSwitcher from "../LanguageSwitcher";
import { canAccessModule } from "../../utils/permissions";
import { BACKEND_STATIC_URL } from "../../features/settings/settingsSlice";

const navigation = [
  { nameKey: "navigation.dashboard", href: "/", icon: HomeIcon, module: null },
  { nameKey: "navigation.donations", href: "/donations", icon: CurrencyDollarIcon, module: "donations" },
  { nameKey: "navigation.inventory", href: "/inventory", icon: ArchiveBoxIcon, module: "inventory" },
  { nameKey: "navigation.expenses", href: "/expenses", icon: DocumentTextIcon, module: "expenses" },
  { nameKey: "navigation.funds", href: "/funds", icon: BanknotesIcon, module: "funds" },
  { nameKey: "navigation.events", href: "/events", icon: CalendarDaysIcon, module: "events" }
  // { nameKey: "navigation.reports", href: "/reports", icon: ChartBarIcon, module: "reports" } // Hidden for now
];

// Admin-only navigation items
const adminNavigation = [
  { nameKey: "navigation.users", href: "/users", icon: UserGroupIcon, module: "users" },
  { nameKey: "navigation.settings", href: "/settings", icon: Cog6ToothIcon, module: null }
];

const Layout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useSelector(state => state.auth);
  const { sidebarOpen } = useSelector(state => state.ui);
  const { templeConfig } = useSelector(state => state.settings);
  const templeName = (templeConfig?.name || 'Temple Tracker').replace(/\|/g, ' ');
  const templeNameLines = (templeConfig?.name || 'Temple Tracker').split('|').filter(Boolean);
  const logoUrl = templeConfig?.logo ? `${BACKEND_STATIC_URL}${templeConfig.logo}` : null;
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

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

  // Filter navigation based on user permissions
  const filteredNavigation = navigation.filter(item => {
    return !item.module || canAccessModule(user, item.module);
  });

  // Admin-only navigation (users, settings)
  const filteredAdminNavigation = user?.role === "admin" ? adminNavigation : [];

  const allNavigation = [...filteredNavigation, ...filteredAdminNavigation];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu overlay */}
      <div className={`fixed inset-0 flex z-40 lg:hidden ${sidebarOpen ? "" : "hidden"}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={toggleSidebarHandler}></div>

        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button type="button" className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" onClick={toggleSidebarHandler}>
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Mobile sidebar header */}
          <div className="flex flex-col items-center pt-6 pb-4 px-4 border-b border-gray-100">
            <div
              className="rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
              style={{ width: 52, height: 52, border: '2px solid #fde68a', boxShadow: '0 0 0 3px #fffbeb', background: '#fffbeb' }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt={templeName} style={{ width: 52, height: 52, objectFit: 'contain' }} />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-saffron-500 to-temple-500 flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
            </div>
            <div className="mt-3 text-center">
              {templeNameLines.map((line, i) => (
                <p key={i} className="text-xs font-bold text-gray-800 leading-snug tracking-wide uppercase">
                  {line}
                </p>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pt-3 pb-4">
            <nav className="px-2 space-y-0.5">
              {allNavigation.map(item => (
                <NavLink key={item.nameKey} to={item.href} onClick={toggleSidebarHandler} className={({ isActive }) => `group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg ${isActive ? "bg-gradient-to-r from-temple-100 to-saffron-50 text-temple-700 border-r-2 border-temple-500" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                  <item.icon className="mr-3 flex-shrink-0 h-5 w-5" />
                  {t(item.nameKey)}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 transition-all duration-300 ${desktopCollapsed ? 'lg:w-16' : 'lg:w-64'}`}>
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 overflow-y-auto overflow-x-hidden">

          {/* Sidebar header: logo + temple name */}
          <div className={`flex flex-col items-center flex-shrink-0 border-b border-gray-100 ${desktopCollapsed ? 'py-4 px-2' : 'pt-5 pb-4 px-4'}`}>
            <div
              className="rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
              style={{
                width: desktopCollapsed ? 40 : 52,
                height: desktopCollapsed ? 40 : 52,
                border: '2px solid #fde68a',
                boxShadow: '0 0 0 3px #fffbeb',
                background: '#fffbeb',
                transition: 'all 0.3s'
              }}
              title={templeName}
            >
              {logoUrl ? (
                <img src={logoUrl} alt={templeName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-saffron-500 to-temple-500 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
            </div>

            {/* Temple name below logo — hidden when collapsed */}
            {!desktopCollapsed && (
              <div className="mt-3 text-center w-full">
                {templeNameLines.map((line, i) => (
                  <p key={i} className="text-xs font-bold text-gray-800 leading-snug tracking-wide uppercase">
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Nav items */}
          <div className="flex-1 flex flex-col pt-3">
            <nav className="flex-1 px-2 space-y-0.5">
              {allNavigation.map(item => (
                <NavLink
                  key={item.nameKey}
                  to={item.href}
                  title={desktopCollapsed ? t(item.nameKey) : undefined}
                  className={({ isActive }) =>
                    `group flex items-center rounded-lg transition-colors ${
                      desktopCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'
                    } text-sm font-medium ${
                      isActive
                        ? "bg-gradient-to-r from-temple-100 to-saffron-50 text-temple-700 border-r-2 border-temple-500"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`
                  }
                >
                  <item.icon className={`flex-shrink-0 h-5 w-5 ${desktopCollapsed ? '' : 'mr-3'}`} />
                  {!desktopCollapsed && <span>{t(item.nameKey)}</span>}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex flex-col flex-1 transition-all duration-300 ${desktopCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        {/* Top navbar */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-14 bg-white shadow-sm border-b border-gray-200">

          {/* Toggle button — mobile hamburger + desktop collapse */}
          <button
            type="button"
            className="px-4 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-temple-500 lg:border-r lg:border-gray-200"
            onClick={() => {
              toggleSidebarHandler(); // mobile
              setDesktopCollapsed(c => !c); // desktop
            }}
            title={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          <div className="flex-1 px-4 flex justify-end items-center space-x-3">
            <LanguageSwitcher />

            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-br from-saffron-500 to-temple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-white">{user?.name?.charAt(0)}</span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900 leading-tight">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize leading-tight">{user?.role}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-temple-500 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1.5" />
              Logout
            </button>
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
