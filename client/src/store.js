import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Import reducers
import authReducer from './features/auth/authSlice';
import decisionsReducer from './features/decisions/decisionsSlice';

// Create a rootReducer 
const rootReducer = combineReducers({
  auth: authReducer,
  decisions: decisionsReducer,
  // Add more reducers here as we create them
});

// Configuration for Redux Persist
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Only persist auth state across sessions
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store); 