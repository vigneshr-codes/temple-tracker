import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import authService from '../../services/authService';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Base URL for static assets (logo, uploads) — strips trailing /api
export const BACKEND_STATIC_URL = API_BASE.replace(/\/api$/, '');

// Fetch public settings — no auth required (used on app load & login page)
export const fetchPublicSettings = createAsyncThunk(
  'settings/fetchPublic',
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(`${API_BASE}/settings/public`);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// Fetch full settings — admin only
export const fetchSettings = createAsyncThunk(
  'settings/fetchFull',
  async (_, thunkAPI) => {
    try {
      const response = await authService.api.get('/settings');
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Upload temple logo — admin only
export const uploadLogo = createAsyncThunk(
  'settings/uploadLogo',
  async (formData, thunkAPI) => {
    try {
      const response = await authService.api.post('/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data; // { logoUrl: '/uploads/logos/temple-logo.ext' }
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Update a settings section — admin only
export const updateSettingsSection = createAsyncThunk(
  'settings/updateSection',
  async ({ section, data }, thunkAPI) => {
    try {
      const response = await authService.api.put(`/settings/${section}`, data);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  templeConfig: {
    name: 'Temple Tracker',
    logo: null,
    contact: {},
    address: {},
    registrationNumber: '',
    panNumber: '',
    exemption80GNumber: '',
    exemption12ANumber: '',
    upiId: '',
    establishedYear: null,
  },
  taxSettings: {},
  language: 'en',
  currency: 'INR',
  fullSettings: null,
  isLoading: false,
  isError: false,
  message: '',
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    resetSettingsStatus: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPublicSettings.fulfilled, (state, action) => {
        state.templeConfig = action.payload.templeConfig || initialState.templeConfig;
        state.taxSettings = action.payload.taxSettings || {};
        state.language = action.payload.language || 'en';
        state.currency = action.payload.currency || 'INR';
      })
      .addCase(fetchSettings.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.fullSettings = action.payload;
        state.templeConfig = action.payload.templeConfig || initialState.templeConfig;
        state.language = action.payload.systemPrefs?.language || 'en';
        state.currency = action.payload.systemPrefs?.currency || 'INR';
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateSettingsSection.fulfilled, (state, action) => {
        state.isLoading = false;
        state.fullSettings = action.payload;
        state.templeConfig = action.payload.templeConfig || state.templeConfig;
      })
      .addCase(uploadLogo.fulfilled, (state, action) => {
        state.templeConfig = { ...state.templeConfig, logo: action.payload.logoUrl };
      });
  },
});

export const { resetSettingsStatus } = settingsSlice.actions;
export default settingsSlice.reducer;
