import { configureStore } from '@reduxjs/toolkit';
import authSlice from '../features/auth/authSlice';
import donationSlice from '../features/donations/donationSlice';
import inventorySlice from '../features/inventory/inventorySlice';
import expenseSlice from '../features/expenses/expenseSlice';
import eventSlice from '../features/events/eventSlice';
import reportSlice from '../features/reports/reportSlice';
import uiSlice from '../features/ui/uiSlice';
import settingsSlice from '../features/settings/settingsSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    donations: donationSlice,
    inventory: inventorySlice,
    expenses: expenseSlice,
    events: eventSlice,
    reports: reportSlice,
    ui: uiSlice,
    settings: settingsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
  devTools: import.meta.env.MODE !== 'production',
});

export default store;