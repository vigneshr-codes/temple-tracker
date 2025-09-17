import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';

const initialState = {
  expenses: [],
  currentExpense: null,
  isLoading: false,
  isError: false,
  message: '',
  totalCount: 0,
  totalAmount: 0,
};

export const createExpense = createAsyncThunk(
  'expenses/create',
  async (expenseData, thunkAPI) => {
    try {
      const response = await authService.api.post('/expenses', expenseData);
      return response.data;
    } catch (error) {
      const message =
        (error.response?.data?.message) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const getExpenses = createAsyncThunk(
  'expenses/getAll',
  async (params, thunkAPI) => {
    try {
      const response = await authService.api.get('/expenses', { params });
      return response.data;
    } catch (error) {
      const message =
        (error.response?.data?.message) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const expenseSlice = createSlice({
  name: 'expenses',
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
      .addCase(createExpense.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.isLoading = false;
        state.expenses.unshift(action.payload.data);
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getExpenses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.expenses = action.payload.data || [];
        state.totalCount = action.payload.totalCount || 0;
        state.totalAmount = action.payload.totalAmount || 0;
      });
  },
});

export const { reset } = expenseSlice.actions;
export default expenseSlice.reducer;