import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Get API URL from environment variable or use default
const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5001') + '/api';

// Helper function to set authorization header
const setAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
};

// Async thunks for decisions
export const fetchDecisions = createAsyncThunk(
  'decisions/fetchDecisions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/decisions`, setAuthHeader());
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch decisions'
      );
    }
  }
);

export const fetchDecision = createAsyncThunk(
  'decisions/fetchDecision',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/decisions/${id}`,
        setAuthHeader()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch decision'
      );
    }
  }
);

export const createDecision = createAsyncThunk(
  'decisions/createDecision',
  async (decisionData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/decisions`,
        decisionData,
        setAuthHeader()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create decision'
      );
    }
  }
);

export const updateDecision = createAsyncThunk(
  'decisions/updateDecision',
  async ({ id, decisionData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_URL}/decisions/${id}`,
        decisionData,
        setAuthHeader()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update decision'
      );
    }
  }
);

export const deleteDecision = createAsyncThunk(
  'decisions/deleteDecision',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/decisions/${id}`, setAuthHeader());
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete decision'
      );
    }
  }
);

export const fetchDecisionResults = createAsyncThunk(
  'decisions/fetchDecisionResults',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/decisions/${id}/results`,
        setAuthHeader()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch decision results'
      );
    }
  }
);

// Add a submitScores action to handle score submissions
export const submitScores = createAsyncThunk(
  'decisions/submitScores',
  async ({ id, scores }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/decisions/${id}/scores`,
        { scores },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      return response.data.data;
    } catch (error) {
      console.error('Error submitting scores:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to submit scores'
      );
    }
  }
);

// Initial state
const initialState = {
  decisions: [],
  currentDecision: null,
  decisionResults: null,
  loading: false,
  error: null,
};

// Decisions slice
const decisionsSlice = createSlice({
  name: 'decisions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentDecision: (state) => {
      state.currentDecision = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all decisions
      .addCase(fetchDecisions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDecisions.fulfilled, (state, action) => {
        state.loading = false;
        state.decisions = action.payload.data;
      })
      .addCase(fetchDecisions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch a specific decision
      .addCase(fetchDecision.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDecision.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDecision = action.payload.data;
      })
      .addCase(fetchDecision.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create a new decision
      .addCase(createDecision.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDecision.fulfilled, (state, action) => {
        state.loading = false;
        state.decisions.push(action.payload.data);
        state.currentDecision = action.payload.data;
      })
      .addCase(createDecision.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update a decision
      .addCase(updateDecision.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDecision.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.decisions.findIndex(
          (decision) => decision.id === action.payload.data.id
        );
        if (index !== -1) {
          state.decisions[index] = action.payload.data;
        }
        state.currentDecision = action.payload.data;
      })
      .addCase(updateDecision.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete a decision
      .addCase(deleteDecision.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDecision.fulfilled, (state, action) => {
        state.loading = false;
        state.decisions = state.decisions.filter(
          (decision) => decision.id !== action.payload
        );
        if (state.currentDecision && state.currentDecision.id === action.payload) {
          state.currentDecision = null;
        }
      })
      .addCase(deleteDecision.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch decision results
      .addCase(fetchDecisionResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDecisionResults.fulfilled, (state, action) => {
        state.loading = false;
        state.decisionResults = action.payload.data;
      })
      .addCase(fetchDecisionResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Submit scores
      .addCase(submitScores.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitScores.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDecision = action.payload;
      })
      .addCase(submitScores.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentDecision } = decisionsSlice.actions;
export default decisionsSlice.reducer; 