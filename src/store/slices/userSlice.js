import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { userService } from "@/services/user.service";

const initialState = {
  user: null,
  loading: false,
  error: null,
  credits: 0
};

export const loginUserThunk = createAsyncThunk(
  "user/login",
  async (payload, { rejectWithValue }) => {
    try {
      const session = await userService.login(payload.username, payload.password);
      return session;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to log in");
    }
  }
);

export const registerUserThunk = createAsyncThunk(
  "user/register",
  async (payload, { rejectWithValue }) => {
    try {
      const session = await userService.register(payload.username, payload.password);
      return session;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to register");
    }
  }
);

export const onboardUserThunk = createAsyncThunk(
  "user/onboard",
  async (payload, { rejectWithValue }) => {
    try {
      const session = await userService.onboard(
        payload.username,
        payload.name,
        payload.email,
        payload.profession,
        payload.teamDetails
      );
      return session;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to complete onboarding");
    }
  }
);

export const fetchCreditsThunk = createAsyncThunk(
  "user/fetchCredits",
  async (username, { rejectWithValue }) => {
    try {
      const credits = await userService.getCredits(username);
      return credits;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const purchaseCreditsThunk = createAsyncThunk(
  "user/purchaseCredits",
  async (payload, { rejectWithValue }) => {
    try {
      const finalCredits = await userService.purchaseCredits(payload.username, payload.amount);
      return finalCredits;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserSession: (state, action) => {
      state.user = action.payload;
      state.credits = action.payload ? action.payload.credits : 0;
    },
    logoutUser: (state) => {
      state.user = null;
      state.credits = 0;
      state.error = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("flowscrape_user");
      }
    },
    clearUserError: (state) => {
      state.error = null;
    },
    setLocalCredits: (state, action) => {
      state.credits = action.payload;
      if (state.user) {
        state.user.credits = action.payload;
        if (typeof window !== "undefined") {
          localStorage.setItem("flowscrape_user", JSON.stringify(state.user));
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUserThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.credits = action.payload.credits;
        if (action.payload.onboardingCompleted && typeof window !== "undefined") {
          localStorage.setItem("flowscrape_user", JSON.stringify(action.payload));
        }
      })
      .addCase(loginUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Register
      .addCase(registerUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUserThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload; // will show onboarding state next
        state.credits = 0;
      })
      .addCase(registerUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Onboard
      .addCase(onboardUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(onboardUserThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.credits = action.payload.credits;
        if (typeof window !== "undefined") {
          localStorage.setItem("flowscrape_user", JSON.stringify(action.payload));
        }
      })
      .addCase(onboardUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Credits fetching
      .addCase(fetchCreditsThunk.fulfilled, (state, action) => {
        state.credits = action.payload;
        if (state.user) {
          state.user.credits = action.payload;
          if (typeof window !== "undefined") {
            localStorage.setItem("flowscrape_user", JSON.stringify(state.user));
          }
        }
      })
      
      // Credits purchasing
      .addCase(purchaseCreditsThunk.fulfilled, (state, action) => {
        state.credits = action.payload;
        if (state.user) {
          state.user.credits = action.payload;
          if (typeof window !== "undefined") {
            localStorage.setItem("flowscrape_user", JSON.stringify(state.user));
          }
        }
      });
  }
});

export const { setUserSession, logoutUser, clearUserError, setLocalCredits } = userSlice.actions;

export default userSlice.reducer;
