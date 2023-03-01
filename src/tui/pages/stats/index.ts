import { StatsComponent } from "./stats";
import { Page } from "tui/components/page";
import { Calendar } from "tui/components/calendar";
import { toLocaleDateString } from "common/util/date-time";

import type { Debug } from "tui/interface";
import type { ReadonlyDeep } from "type-fest";
import type { ShortStats } from "tui/store/interface";
import type TimerManager from "tui/util/timer-manager";
import type { TimerRefWithName } from "src/controllers/timer/interface";
import type { WorkSessionFields } from "entities/work-session/work-session";

export interface createStatsPage_Argument {
  debug: Debug;
  renderScreen(): void;
  timerManager: TimerManager;
  getWorkSessions: (arg: {
    date: string;
  }) => Promise<ReadonlyDeep<WorkSessionFields<TimerRefWithName>[]>>;
}
export function createStatsPage(arg: createStatsPage_Argument) {
  const { debug, renderScreen, timerManager, getWorkSessions } = arg;

  const calendar = new Calendar({
    debug,
    renderScreen,
    timerManager,
    dimension: { height: "100%" },
    position: { top: 0, left: 0 },
  });

  calendar.setCurrentYear({ year: new Date().getFullYear() });

  let shortStats: ShortStats | undefined;

  // highlight the days with at least one work session
  calendar.customDateFormatter = ({ dateObject }) => {
    if (!shortStats || !dateObject) return undefined; // needed to prevent any styling

    const localDateString = toLocaleDateString(dateObject);
    if (localDateString in shortStats) return { fg: "green" };

    return undefined; // needed to prevent any styling
  };

  function setFirstDayOfWeek(dayName: string) {
    calendar.setFirstDayOfWeek(dayName);
  }

  function updateShortStats(_shortStats: ShortStats) {
    shortStats = _shortStats;

    // clearing the cace will re-render the calender so the new stats
    // will also appear on the calender
    calendar.clearCache();
  }

  // ----------------------------- Stats Component ----------------------
  const statsComponent = new StatsComponent({
    debug,
    renderScreen,
    position: { left: Calendar.ELEMENT_WIDTH, top: 0 },
    async fetchWorkSessions({ date }) {
      try {
        return await getWorkSessions({ date });
      } catch (ex) {
        return null;
      }
    },
  });

  calendar.onSelect = ({ date }) => {
    if (!date) return;
    statsComponent.setDate(date);
  };

  const page = new Page({
    debug,
    top: 1,
    renderScreen,
    children: [calendar.element, statsComponent.element],
    focusArray: [calendar.element, ...statsComponent.children],
  });

  return { page, setFirstDayOfWeek, updateShortStats };
}
