import {
  MS_IN_ONE_MINUTE,
  unixMsTimestampToUsLocaleDateString,
} from "common/util/date-time";
import { pick } from "common/util/other";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import type { AppDispatch, StoreInterface } from "tui/store";
import type WorkSessionService from "client/services/work-session";
import type { TimerRefWithName } from "src/controllers/timer/interface";
import type { ErrorMessageAndCode, StatsState } from "tui/store/interface";
import type { WorkSessionFields } from "entities/work-session/work-session";
import type { StatisticsInterface } from "src/use-cases/interfaces/work-session-db";

const WORK_SESSION_CACHE_TIME = 5 * MS_IN_ONE_MINUTE;

const statsSlice = createSlice({
  name: "stats",
  initialState: {
    error: null,
    status: "idle",
    shortStatOfAllDays: {},
    workSessionsPerDate: {},
  } as StatsState,
  reducers: {
    statsFetched(
      state: StatsState,
      action: PayloadAction<StatisticsInterface>
    ) {
      const shortStatOfAllDays: StatsState["shortStatOfAllDays"] = {};

      action.payload.forEach((dailyStat) => {
        shortStatOfAllDays[
          unixMsTimestampToUsLocaleDateString(dailyStat.date)
        ] = dailyStat;
      });

      state.error = null;
      state.status = "loaded";
      state.workSessionsPerDate = {};
      state.shortStatOfAllDays = shortStatOfAllDays;
    },

    statsFetchFailed(
      state: StatsState,
      action: PayloadAction<ErrorMessageAndCode>
    ) {
      state.status = "error";
      state.error = action.payload;
    },

    statsFetchStarted(state: StatsState) {
      state.status = "loading";
    },

    workSessionsFetched(
      state: StatsState,
      action: PayloadAction<{
        date: string;
        workSessions: WorkSessionFields<TimerRefWithName>[];
      }>
    ) {
      const { date, workSessions } = action.payload;

      state.workSessionsPerDate[date] = {
        workSessions,
        fetchTimestamp: Date.now(),
      };
    },
  },
});

const { reducer: statsReducer, actions } = statsSlice;
export default statsReducer;

// Thunks
export const loadShortStats =
  (workSessionService: WorkSessionService) => async (dispatch: AppDispatch) => {
    try {
      dispatch(actions.statsFetchStarted());
      const shortStats = await workSessionService.getStats();
      dispatch(actions.statsFetched(shortStats));
    } catch (ex) {
      dispatch(actions.statsFetchFailed(pick(ex, ["message", "code"])));
    }
  };

// Selectors
export const selectShortStats = (store: StoreInterface) =>
  store.getState().stats.shortStatOfAllDays;

export const selectWorkSessions = async (arg: {
  date: string;
  store: StoreInterface;
  workSessionService: WorkSessionService;
}) => {
  const { date, store } = arg;
  const { workSessionsPerDate } = store.getState().stats;

  {
    const isWorkSessionCached =
      workSessionsPerDate[date] &&
      Date.now() - workSessionsPerDate[date].fetchTimestamp <
        WORK_SESSION_CACHE_TIME;

    if (isWorkSessionCached) return workSessionsPerDate[date].workSessions;
  }

  const workSessions = await arg.workSessionService.getWorkSessions({
    to: date,
    from: date,
  });

  store.dispatch(actions.workSessionsFetched({ date, workSessions }));

  return workSessions;
};
