import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';

const initialState = {
  donations: [],
  currentDonation: null,
  isLoading: false,
  isError: false,
  message: '',
  totalCount: 0,
  totalAmount: 0,
};

// Create donation
export const createDonation = createAsyncThunk(
  'donations/create',
  async (donationData, thunkAPI) => {
    try {
      const response = await authService.api.post('/donations', donationData);
      return response.data;
    } catch (error) {
      const message =
        (error.response?.data?.message) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get donations
export const getDonations = createAsyncThunk(
  'donations/getAll',
  async (params, thunkAPI) => {
    try {
      const response = await authService.api.get('/donations', { params });
      return response.data;
    } catch (error) {
      const message =
        (error.response?.data?.message) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get donation by ID
export const getDonation = createAsyncThunk(
  'donations/getById',
  async (id, thunkAPI) => {
    try {
      const response = await authService.api.get(`/donations/${id}`);
      return response.data;
    } catch (error) {
      const message =
        (error.response?.data?.message) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const donationSlice = createSlice({
  name: 'donations',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.message = '';
    },
    clearCurrentDonation: (state) => {
      state.currentDonation = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createDonation.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createDonation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.donations.unshift(action.payload.data);
      })
      .addCase(createDonation.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getDonations.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getDonations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.donations = action.payload.data || [];
        state.totalCount = action.payload.totalCount || 0;
        state.totalAmount = action.payload.totalAmount || 0;
      })
      .addCase(getDonations.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getDonation.fulfilled, (state, action) => {
        state.currentDonation = action.payload.data;
      });
  },
});

export const { reset, clearCurrentDonation } = donationSlice.actions;
export default donationSlice.reducer;