import type {
  CategoryState,
  CategoryInterface,
  ErrorMessageAndCode,
} from "./interface";
import type { AppDispatch, StoreInterface } from ".";

import { pick } from "common/util/other";
import { createIdToIndexMap } from "./util";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type CategoryService from "client/services/category";

// Slice
const categorySlice = createSlice({
  name: "category",
  initialState: {
    error: null,
    status: "idle",
    idToIndexMap: {},
    categoriesArray: [],
  } as CategoryState,
  reducers: {
    categoriesFetched(
      state: CategoryState,
      action: PayloadAction<CategoryInterface[]>
    ) {
      const categories = action.payload;

      state.status = "loaded";
      state.categoriesArray = categories;
      state.idToIndexMap = createIdToIndexMap(categories);
    },

    categoriesFetchFailed(
      state: CategoryState,
      action: PayloadAction<ErrorMessageAndCode>
    ) {
      state.status = "error";
      state.error = action.payload;
    },

    categoriesFetchStarted(state: CategoryState) {
      state.status = "loading";
    },
  },
});

const { reducer: categoryReducer, actions } = categorySlice;
export default categoryReducer;

// Thunks
export const loadCategories =
  (categoryService: CategoryService) => async (dispatch: AppDispatch) => {
    try {
      dispatch(actions.categoriesFetchStarted());
      const categories = await categoryService.findAll();
      dispatch(actions.categoriesFetched(categories));
    } catch (ex) {
      dispatch(actions.categoriesFetchFailed(pick(ex, ["message", "code"])));
    }
  };

// Selectors
export const selectCategories = (store: StoreInterface) =>
  store.getState().category.categoriesArray;
