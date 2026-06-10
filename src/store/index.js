import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import workflowsReducer from "./slices/workflowsSlice";
import credentialsReducer from "./slices/credentialsSlice";
import runsReducer from "./slices/runsSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    workflows: workflowsReducer,
    credentials: credentialsReducer,
    runs: runsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
