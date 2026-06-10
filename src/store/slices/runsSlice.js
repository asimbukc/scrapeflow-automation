import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { runsService } from "@/services/runs.service";

const initialState = {
  runs: [],
  activeRunId: null,
  loading: false,
  error: null
};

export const fetchRunsThunk = createAsyncThunk(
  "runs/fetchAll",
  async (username, { rejectWithValue }) => {
    try {
      const list = await runsService.getRuns(username);
      return list;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to load runs history");
    }
  }
);

export const fetchRunByIdThunk = createAsyncThunk(
  "runs/fetchById",
  async (payload, { rejectWithValue }) => {
    try {
      const run = await runsService.getRunById(payload.username, payload.runId);
      return run;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const triggerRunThunk = createAsyncThunk(
  "runs/trigger",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const newRun = await runsService.createRun(
        payload.username,
        payload.workflowId,
        payload.workflowName,
        payload.credits,
        payload.nodes
      );
      
      dispatch(fetchRunsThunk(payload.username));
      
      return newRun;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to launch run threads");
    }
  }
);

const runsSlice = createSlice({
  name: "runs",
  initialState,
  reducers: {
    setActiveRunId: (state, action) => {
      state.activeRunId = action.payload;
    },
    updateLocalRunProgress: (state, action) => {
      const idx = state.runs.findIndex((r) => r.id === action.payload.id);
      if (idx !== -1) {
        state.runs[idx] = action.payload;
      } else {
        state.runs.unshift(action.payload);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchRunsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRunsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.runs = action.payload;
      })
      .addCase(fetchRunsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch By Id
      .addCase(fetchRunByIdThunk.fulfilled, (state, action) => {
        if (action.payload) {
          const idx = state.runs.findIndex((r) => r.id === action.payload.id);
          if (idx !== -1) {
            state.runs[idx] = action.payload;
          } else {
            state.runs.push(action.payload);
          }
        }
      })

      // Trigger Run
      .addCase(triggerRunThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(triggerRunThunk.fulfilled, (state, action) => {
        state.runs.unshift(action.payload);
        state.activeRunId = action.payload.id;
      })
      .addCase(triggerRunThunk.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const { setActiveRunId, updateLocalRunProgress } = runsSlice.actions;

export default runsSlice.reducer;
