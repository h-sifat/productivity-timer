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
  middleware(getDefaultMiddleware) {
    const isDevBuild = __BUILD_MODE__ !== "production";

    return getDefaultMiddleware({
      thunk: true,
      immutableCheck: isDevBuild,
      serializableCheck: isDevBuild,
    });
  },
});

export type StoreInterface = typeof store;
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
