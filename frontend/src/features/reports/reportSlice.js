import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';

const initialState = {
  dashboardStats: null,
  incomeReport: null,
  expenseReport: null,
  balanceSheet: null,
  inventoryReport: null,
  isLoading: false,
  isError: false,
  message: '',
};

export const getDashboardStats = createAsyncThunk(
  'reports/getDashboardStats',
  async (_, thunkAPI) => {
    try {
      const response = await authService.api.get('/reports/dashboard');
      return response.data;
    } catch (error) {
      const message =
        (error.response?.data?.message) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const getIncomeReport = createAsyncThunk(
  'reports/getIncomeReport',
  async (params, thunkAPI) => {
    try {
      const response = await authService.api.get('/reports/income', { params });
      return response.data;
    } catch (error) {
      const message =
        (error.response?.data?.message) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const reportSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getDashboardStats.fulfilled, (state, action) => {
        state.dashboardStats = action.payload.data;
      })
      .addCase(getIncomeReport.fulfilled, (state, action) => {
        state.incomeReport = action.payload.data;
      });
  },
});

export const { reset } = reportSlice.actions;
export default reportSlice.reducer;