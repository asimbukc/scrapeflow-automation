import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { credentialsService } from "@/services/credentials.service";

const initialState = {
  credentials: [],
  loading: false,
  error: null
};

export const fetchCredentialsThunk = createAsyncThunk(
  "credentials/fetchAll",
  async (username, { rejectWithValue }) => {
    try {
      const list = await credentialsService.getCredentials(username);
      return list;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to load credentials");
    }
  }
);

export const addCredentialThunk = createAsyncThunk(
  "credentials/add",
  async (payload, { rejectWithValue }) => {
    try {
      const newCred = await credentialsService.addCredential(
        payload.username,
        payload.name,
        payload.type,
        payload.value
      );
      return newCred;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to add credential");
    }
  }
);

export const deleteCredentialThunk = createAsyncThunk(
  "credentials/delete",
  async (payload, { rejectWithValue }) => {
    try {
      await credentialsService.deleteCredential(payload.username, payload.id);
      return payload.id;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to delete credential");
    }
  }
);

const credentialsSlice = createSlice({
  name: "credentials",
  initialState,
  reducers: {
    clearCredentialsError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchCredentialsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCredentialsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.credentials = action.payload;
      })
      .addCase(fetchCredentialsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add
      .addCase(addCredentialThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCredentialThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.credentials.unshift(action.payload);
      })
      .addCase(addCredentialThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete
      .addCase(deleteCredentialThunk.fulfilled, (state, action) => {
        state.credentials = state.credentials.filter((c) => c.id !== action.payload);
      });
  }
});

export const { clearCredentialsError } = credentialsSlice.actions;

export default credentialsSlice.reducer;
