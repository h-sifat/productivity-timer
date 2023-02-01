import { configureStore } from "@reduxjs/toolkit";
import categoryReducer from "./categorySlice";
import projectReducer from "./projectSlice";

export const store = configureStore({
  reducer: {
    project: projectReducer,
    category: categoryReducer,
  },
});

export type StoreInterface = typeof store;
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
