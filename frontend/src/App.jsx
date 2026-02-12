import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './store/store';
import { fetchPublicSettings } from './features/settings/settingsSlice';
import './i18n'; // Initialize i18n
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Donations from './pages/Donations/Donations';
import Inventory from './pages/Inventory/Inventory';
import Expenses from './pages/Expenses/Expenses';
import Funds from './pages/Funds/Funds';
import Reports from './pages/Reports/Reports';
import Events from './pages/Events/Events';
import Settings from './pages/Settings/Settings';
import Users from './pages/Users/Users';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import NotFound from './pages/NotFound/NotFound';
import Toast from './components/Common/Toast';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function AppInit() {
  const dispatch = useDispatch();
  const { templeConfig } = useSelector((state) => state.settings);

  useEffect(() => {
    dispatch(fetchPublicSettings());
  }, [dispatch]);

  useEffect(() => {
    if (templeConfig?.name) {
      document.title = templeConfig.name.replace(/\|/g, ' ');
    }
  }, [templeConfig]);

  return null;
}

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AppInit />
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="donations" element={<Donations />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="funds" element={<Funds />} />
                <Route path="events" element={<Events />} />
                <Route path="reports" element={<Reports />} />
                <Route path="users" element={<Users />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toast />
          </div>
        </Router>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;