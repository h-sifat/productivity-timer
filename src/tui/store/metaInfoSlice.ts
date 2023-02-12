import type { AppDispatch, StoreInterface } from ".";
import type MetaInfoService from "client/services/meta-info";
import type { PublicMetaInfoInterface } from "entities/meta";
import type { ErrorMessageAndCode, MetaInfoState } from "./interface";

import { pick } from "common/util/other";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const metaInfoSlice = createSlice({
  name: "meta-info",
  initialState: {
    error: null,
    metaInfo: null,
    status: "idle",
  } as MetaInfoState,
  reducers: {
    metaInfoFetched(
      state: MetaInfoState,
      action: PayloadAction<PublicMetaInfoInterface>
    ) {
      state.error = null;
      state.status = "loaded";
      state.metaInfo = action.payload;
    },

    metaInfoFetchFailed(
      state: MetaInfoState,
      action: PayloadAction<ErrorMessageAndCode>
    ) {
      state.status = "error";
      state.error = action.payload;
    },

    metaInfoFetchStarted(state: MetaInfoState) {
      state.status = "loading";
    },
  },
});

const { reducer: metaInfoReducer, actions } = metaInfoSlice;
export default metaInfoReducer;

// Thunks
export const loadMetaInfo =
  (metaInfoService: MetaInfoService) => async (dispatch: AppDispatch) => {
    try {
      dispatch(actions.metaInfoFetchStarted());
      const metaInfo = await metaInfoService.get();
      dispatch(actions.metaInfoFetched(metaInfo));
    } catch (ex) {
      dispatch(actions.metaInfoFetchFailed(pick(ex, ["message", "code"])));
    }
  };

// Selectors
export const selectMetaInfo = (store: StoreInterface) =>
  store.getState().metaInfo.metaInfo;
