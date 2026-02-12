import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';

const initialState = {
  inventory: [],
  currentItem: null,
  isLoading: false,
  isError: false,
  message: '',
  totalItems: 0,
  expiringItems: [],
  expiredCount: 0,
  expiringSoonCount: 0,
};

// Get inventory
export const getInventory = createAsyncThunk(
  'inventory/getAll',
  async (params, thunkAPI) => {
    try {
      const response = await authService.api.get('/inventory', { params });
      return response.data;
    } catch (error) {
      const message =
        (error.response?.data?.message) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Use inventory item
export const useInventoryItem = createAsyncThunk(
  'inventory/useItem',
  async ({ id, usageData }, thunkAPI) => {
    try {
      const response = await authService.api.post(`/inventory/${id}/use`, usageData);
      return response.data;
    } catch (error) {
      const message =
        (error.response?.data?.message) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get expiring items
export const getExpiringItems = createAsyncThunk(
  'inventory/getExpiring',
  async (_, thunkAPI) => {
    try {
      const response = await authService.api.get('/inventory/expiring');
      return response.data;
    } catch (error) {
      const message =
        (error.response?.data?.message) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.message = '';
    },
    clearCurrentItem: (state) => {
      state.currentItem = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getInventory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getInventory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.inventory = action.payload.data || [];
        state.totalItems = action.payload.pagination?.total || 0;
        state.expiredCount = action.payload.expiredCount || 0;
        state.expiringSoonCount = action.payload.expiringSoonCount || 0;
      })
      .addCase(getInventory.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(useInventoryItem.fulfilled, (state, action) => {
        const index = state.inventory.findIndex(
          (item) => item._id === action.payload.data._id
        );
        if (index !== -1) {
          state.inventory[index] = action.payload.data;
        }
      })
      .addCase(getExpiringItems.fulfilled, (state, action) => {
        state.expiringItems = action.payload.data || [];
      });
  },
});

export const { reset, clearCurrentItem } = inventorySlice.actions;
export default inventorySlice.reducer;