import axios from 'axios';

// Dynamic API URL based on current host
const getApiUrl = () => {
  // In development, use environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In production, construct API URL based on current location
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  // If frontend is on port 80/443 (production), backend is on 3001
  if (window.location.port === '' || window.location.port === '80' || window.location.port === '443') {
    return `${protocol}//${hostname}:3001/api`;
  }
  
  // Default fallback
  return 'http://localhost:3001/api';
};

const API_URL = getApiUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('temple_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('temple_token');
      localStorage.removeItem('temple_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Register user
const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  
  if (response.data) {
    localStorage.setItem('temple_token', response.data.token);
    localStorage.setItem('temple_user', JSON.stringify(response.data.data));
  }
  
  return response.data;
};

// Login user
const login = async (userData) => {
  const response = await api.post('/auth/login', userData);
  
  if (response.data) {
    localStorage.setItem('temple_token', response.data.token);
    localStorage.setItem('temple_user', JSON.stringify(response.data.data));
  }
  
  return response.data;
};

// Logout user
const logout = () => {
  localStorage.removeItem('temple_token');
  localStorage.removeItem('temple_user');
};

// Get current user
const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Update password
const updatePassword = async (passwordData) => {
  const response = await api.put('/auth/updatepassword', passwordData);
  
  if (response.data) {
    localStorage.setItem('temple_token', response.data.token);
  }
  
  return response.data;
};

const authService = {
  register,
  login,
  logout,
  getMe,
  updatePassword,
  api, // Export api instance for use in other services
};

export default authService;