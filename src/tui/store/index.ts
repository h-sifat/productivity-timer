import statsReducer from "./statsSlice";
import projectReducer from "./projectSlice";
import categoryReducer from "./categorySlice";
import metaInfoReducer from "./metaInfoSlice";
import { configureStore } from "@reduxjs/toolkit";

export const store = configureStore({
  reducer: {
    stats: statsReducer,
    project: projectReducer,
    category: categoryReducer,
    metaInfo: metaInfoReducer,
  },
});

export type StoreInterface = typeof store;
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
