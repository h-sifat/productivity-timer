import type {
  ProjectState,
  ProjectInterface,
  ErrorMessageAndCode,
} from "./interface";
import type { AppDispatch, StoreInterface } from ".";
import type ProjectService from "client/services/project";

import { pick } from "common/util/other";
import { createIdToIndexMap } from "./util";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Slice
const projectSlice = createSlice({
  name: "project",
  initialState: {
    error: null,
    projectsArray: [],
    status: "idle",
    idToIndexMap: {},
  } as ProjectState,

  reducers: {
    projectsFetched(
      state: ProjectState,
      action: PayloadAction<ProjectInterface[]>
    ) {
      const projects = action.payload;

      state.status = "loaded";
      state.projectsArray = projects;
      state.idToIndexMap = createIdToIndexMap(projects);
    },

    projectsFetchFailed(
      state: ProjectState,
      action: PayloadAction<ErrorMessageAndCode>
    ) {
      state.status = "error";
      state.error = action.payload;
    },

    projectsFetchStarted(state: ProjectState) {
      state.status = "loading";
    },
  },
});

const { reducer: projectReducer, actions } = projectSlice;
export default projectReducer;

// Thunks
export const loadProjects =
  (projectService: ProjectService) => async (dispatch: AppDispatch) => {
    try {
      dispatch(actions.projectsFetchStarted());
      const projects = await projectService.findAll();
      dispatch(actions.projectsFetched(projects));
    } catch (ex) {
      dispatch(actions.projectsFetchFailed(pick(ex, ["message", "code"])));
    }
  };

// Selectors
export const selectProjects = (store: StoreInterface) =>
  store.getState().project.projectsArray;
