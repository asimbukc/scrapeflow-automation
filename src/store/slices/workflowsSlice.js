import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { workflowService } from "@/services/workflow.service";

const initialState = {
  workflows: [],
  selectedWorkflow: null,
  activeTab: "home",
  activeSubTab: "editor",
  loading: false,
  error: null
};

export const fetchWorkflowsThunk = createAsyncThunk(
  "workflows/fetchAll",
  async (username, { rejectWithValue }) => {
    try {
      const list = await workflowService.getWorkflows(username);
      return list;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to load workflows");
    }
  }
);

export const createWorkflowThunk = createAsyncThunk(
  "workflows/create",
  async (payload, { rejectWithValue }) => {
    try {
      const newWf = await workflowService.createWorkflow(
        payload.username,
        payload.name,
        payload.description
      );
      return newWf;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to create workflow");
    }
  }
);

export const saveWorkflowThunk = createAsyncThunk(
  "workflows/save",
  async (payload, { rejectWithValue }) => {
    try {
      const updatedWf = await workflowService.saveWorkflow(
        payload.username,
        payload.id,
        payload.nodes,
        payload.edges,
        payload.credits
      );
      return updatedWf;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to save workflow");
    }
  }
);

export const deleteWorkflowThunk = createAsyncThunk(
  "workflows/delete",
  async (payload, { rejectWithValue }) => {
    try {
      await workflowService.deleteWorkflow(payload.username, payload.id);
      return payload.id;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to delete workflow");
    }
  }
);

const workflowsSlice = createSlice({
  name: "workflows",
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
      state.selectedWorkflow = null; // Clear detail views when navigating away
    },
    setActiveSubTab: (state, action) => {
      state.activeSubTab = action.payload;
    },
    setSelectedWorkflow: (state, action) => {
      state.selectedWorkflow = action.payload;
      if (action.payload) {
        state.activeSubTab = "editor";
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchWorkflowsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWorkflowsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.workflows = action.payload;
      })
      .addCase(fetchWorkflowsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create
      .addCase(createWorkflowThunk.fulfilled, (state, action) => {
        state.workflows.unshift(action.payload);
        state.selectedWorkflow = action.payload;
        state.activeSubTab = "editor";
      })

      // Save
      .addCase(saveWorkflowThunk.fulfilled, (state, action) => {
        state.workflows = state.workflows.map((w) =>
          w.id === action.payload.id ? action.payload : w
        );
        if (state.selectedWorkflow?.id === action.payload.id) {
          state.selectedWorkflow = action.payload;
        }
      })

      // Delete
      .addCase(deleteWorkflowThunk.fulfilled, (state, action) => {
        state.workflows = state.workflows.filter((w) => w.id !== action.payload);
        if (state.selectedWorkflow?.id === action.payload) {
          state.selectedWorkflow = null;
        }
      });
  }
});

export const { setActiveTab, setActiveSubTab, setSelectedWorkflow } = workflowsSlice.actions;

export default workflowsSlice.reducer;
