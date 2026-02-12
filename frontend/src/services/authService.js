import axios from 'axios';

// Dynamic API URL based on current host
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  if (window.location.port === '' || window.location.port === '80' || window.location.port === '443') {
    return `${protocol}//${hostname}:3001/api`;
  }
  return 'http://localhost:3001/api';
};

const API_URL = getApiUrl();

// Create axios instance — withCredentials sends the httpOnly auth cookie automatically
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor: on 401 clear user profile and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('temple_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Register user
const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  if (response.data?.data) {
    localStorage.setItem('temple_user', JSON.stringify(response.data.data));
  }
  return response.data;
};

// Login user — token arrives as httpOnly cookie, we only store user profile for UI
const login = async (userData) => {
  const response = await api.post('/auth/login', userData);
  if (response.data?.data) {
    localStorage.setItem('temple_user', JSON.stringify(response.data.data));
  }
  return response.data;
};

// Logout user — call backend to clear the httpOnly cookie, then clear local profile
const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch {
    // ignore network errors on logout
  } finally {
    localStorage.removeItem('temple_user');
  }
};

// Get current user and refresh local profile cache
const getMe = async () => {
  const response = await api.get('/auth/me');
  if (response.data?.data) {
    localStorage.setItem('temple_user', JSON.stringify(response.data.data));
  }
  return response.data;
};

// Update password
const updatePassword = async (passwordData) => {
  const response = await api.put('/auth/updatepassword', passwordData);
  return response.data;
};

const authService = {
  register,
  login,
  logout,
  getMe,
  updatePassword,
  api,
};

export default authService;
