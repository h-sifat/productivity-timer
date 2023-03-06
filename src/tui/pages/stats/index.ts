import { StatsComponent } from "./stats";
import { Page } from "tui/components/page";
import { Calendar } from "tui/components/calendar";
import { toLocaleDateString } from "common/util/date-time";
import { createInstructionsBox } from "tui/components/instructions";

import type { Debug } from "tui/interface";
import type { ReadonlyDeep } from "type-fest";
import type { Alert } from "tui/components/alert";
import type { ShortStats } from "tui/store/interface";
import type TimerManager from "tui/util/timer-manager";
import type { TimerRefWithName } from "src/controllers/timer/interface";
import type { WorkSessionFields } from "entities/work-session/work-session";
import { DAY_NAMES_LOWERCASE } from "tui/components/calendar/util";

export interface createStatsPage_Argument {
  alert: Alert;
  debug: Debug;
  renderScreen(): void;
  timerManager: TimerManager;
  getWorkSessions: (arg: {
    date: string;
  }) => Promise<ReadonlyDeep<WorkSessionFields<TimerRefWithName>[]>>;
  getSummaryStats(): Promise<ReadonlyDeep<ShortStats>>;
}
export function createStatsPage(arg: createStatsPage_Argument) {
  const {
    debug,
    renderScreen,
    timerManager,
    getWorkSessions,
    getSummaryStats,
  } = arg;

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

  // ----------------------------- Stats Component ----------------------
  const statsComponent = new StatsComponent({
    debug,
    renderScreen,
    alert: arg.alert,
    position: { left: Calendar.ELEMENT_WIDTH, top: 0 },
    dimension: { height: "100%-1" },
    async fetchWorkSessions({ date }) {
      try {
        return await getWorkSessions({ date });
      } catch (ex) {
        return null;
      }
    },
    async fetchStatsSummary() {
      try {
        return await getSummaryStats();
      } catch (ex) {
        return null;
      }
    },
  });

  const instructionsElement = createInstructionsBox({
    bottom: 0,
    height: 3,
    border: true,
    align: "center",
    instructions: {
      "shift-[y|m|w|d]": "[yearly | monthly | weekly | daily] view",
    },
    left: Calendar.ELEMENT_WIDTH,
  });

  statsComponent.element.on("focus", () => {
    instructionsElement.style = { border: { fg: "green" } };
  });

  statsComponent.element.on("blur", () => {
    instructionsElement.style = { border: { fg: "white" } };
  });

  calendar.onSelect = ({ date }) => {
    if (!date) return;
    statsComponent.setDate(date);
  };

  const page = new Page({
    debug,
    top: 1,
    renderScreen,
    focusArray: [calendar.element, ...statsComponent.children],
    children: [calendar.element, statsComponent.element, instructionsElement],
  });

  function setFirstDayOfWeek(dayName: string) {
    calendar.setFirstDayOfWeek(dayName);
    statsComponent.firstDayOfWeek = DAY_NAMES_LOWERCASE.findIndex((names) =>
      names.includes(dayName)
    );
  }

  function updateShortStats(_shortStats: ShortStats) {
    shortStats = _shortStats;

    // clearing the cace will re-render the calender so the new stats
    // will also appear on the calender
    calendar.clearCache();
  }

  return { page, setFirstDayOfWeek, updateShortStats };
}
