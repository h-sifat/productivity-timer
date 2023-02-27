import { Debug } from "tui/interface";
import { Page } from "tui/components/page";
import { ShortStats } from "tui/store/interface";
import TimerManager from "tui/util/timer-manager";
import { Calendar } from "tui/components/calendar";
import { toLocaleDateString } from "common/util/date-time";

export interface createStatsPage_Argument {
  debug: Debug;
  renderScreen(): void;
  timerManager: TimerManager;
}
export function createStatsPage(arg: createStatsPage_Argument) {
  const { debug, renderScreen, timerManager } = arg;

  const calendar = new Calendar({
    debug,
    renderScreen,
    timerManager,
    dimension: { height: "100%" },
    position: { top: 0, left: 0 },
  });

  const page = new Page({
    debug,
    top: 1,
    children: [calendar.element],
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

  return { page, setFirstDayOfWeek, updateShortStats };
}
