import type {
  Debug,
  ElementPosition,
  ElementDimension,
  BlessedKeypressHandler,
} from "tui/interface";
import type { Widgets } from "blessed";
import type { ReadonlyDeep } from "type-fest";
import type { Alert } from "tui/components/alert";
import type { ShortStats } from "tui/store/interface";
import type { DailyStat } from "use-cases/interfaces/work-session-db";
import type { TimerRefWithName } from "src/controllers/timer/interface";
import type { WorkSessionFields } from "entities/work-session/work-session";

import {
  endOfWeek,
  endOfYear,
  isSameDay,
  endOfMonth,
  startOfWeek,
  startOfYear,
  startOfMonth,
  eachDayOfInterval,
  format as formatDate,
} from "date-fns";
import {
  convertDuration,
  toLocaleDateString,
  timestampToLocaleTimeString,
} from "common/util/date-time";
import blessed from "blessed";
import { last } from "lodash";
import { pick } from "common/util/other";
import { Table } from "tui/components/table";
import { formatDuration } from "cli/util/timer";
import { PieChart } from "tui/components/pie-chart";
import { LineChart } from "tui/components/line-chart";
import { MONTHS_NAMES } from "tui/components/calendar/util";
import { pickDimensionalProps, pickPositionalProps } from "tui/util/other";

export interface Stats_Argument {
  alert: Alert;
  debug: Debug;
  renderScreen(): void;
  position?: ElementPosition;
  dimension?: ElementDimension;
  fetchStatsSummary: FetchStatsSummary;
  fetchWorkSessions: FetchWorkSessions;
}

type AggregatedEntry = Pick<TimerRefWithName, "type" | "name"> & {
  label: string;
  duration: number;
};

export type StatsWorkSession = WorkSessionFields<TimerRefWithName>;

export type FetchWorkSessions = (arg: {
  date: string;
}) => Promise<ReadonlyDeep<StatsWorkSession[]> | null>;
export type FetchStatsSummary = () => Promise<ReadonlyDeep<ShortStats> | null>;

export interface DateRange {
  end: Date;
  start: Date;
}

export enum StatsViewType {
  DAILY = "daily",
  WEEKLY = "weekly",
  YEARLY = "yearly",
  MONTHLY = "monthly",
}
Object.freeze(StatsViewType);

const dateForLabelFormatPattern: { [key: string]: string } = {
  [StatsViewType.YEARLY]: "yyyy",
  [StatsViewType.WEEKLY]: "do MMM yy",
  [StatsViewType.DAILY]: "do MMM yyyy",
  [StatsViewType.MONTHLY]: "MMMM yyyy",
};

export class StatsComponent {
  readonly #alert: Alert;
  readonly #debug: Debug;
  readonly #renderScreen: () => void;
  readonly #fetchStatsSummary: FetchStatsSummary;
  readonly #fetchWorkSessions: FetchWorkSessions;

  readonly #wrapper: Widgets.BoxElement;
  readonly #pieChart: PieChart;
  readonly #dailyTable: Table<
    Pick<AggregatedEntry, "name" | "type" | "duration"> &
      Record<"from" | "to", string>
  >;
  readonly #totalDurationTable: Table<
    Pick<AggregatedEntry, "name" | "type" | "duration">
  >;
  readonly #lineChart: LineChart;

  #date: Date | null = null;
  #indexOfFirstDayOfWeek: number = 6;
  #viewType: StatsViewType = StatsViewType.DAILY;

  constructor(arg: Stats_Argument) {
    const { debug, renderScreen } = arg;
    this.#debug = arg.debug;
    this.#alert = arg.alert;
    this.#renderScreen = arg.renderScreen;
    this.#fetchWorkSessions = arg.fetchWorkSessions;
    this.#fetchStatsSummary = arg.fetchStatsSummary;

    this.#wrapper = blessed.box({
      border: "line",
      scrollable: true,
      mouse: true,
      ...pickPositionalProps(arg.position),
      ...pickDimensionalProps(arg.dimension),
      style: {
        label: { fg: "green" },
        border: { fg: "white" },
        focus: { border: { fg: "green" } },
      },
      scrollbar: { ch: " ", style: { fg: "white", bg: "grey" } },
    });

    const PIE_CHART_HEIGHT = 19;
    const LINE_CHART_HEIGHT = 15;
    const CHILDREN_WIDTH = "100%-3";
    const DAILY_SESSIONS_TABLE_HEIGHT = 12;
    const TOTAL_DURATION_TABLE_HEIGHT = 12;

    const DAILY_TABLE_TOP_POSITION =
      PIE_CHART_HEIGHT + TOTAL_DURATION_TABLE_HEIGHT;

    this.#pieChart = new PieChart({
      debug,
      renderScreen,
      border: false,
      position: { top: 0 },
      dimension: { width: CHILDREN_WIDTH, height: PIE_CHART_HEIGHT },
    });

    const commonTableArg = ({
      top,
      height,
    }: {
      top: number | string;
      height: string | number;
    }) => ({
      debug,
      renderScreen,
      position: { left: 0, top },
      dimension: { height, width: CHILDREN_WIDTH },
      formatObject: (rowObject: { duration: number }) => ({
        ...rowObject,
        duration: formatDuration(rowObject.duration),
      }),
    });

    this.#totalDurationTable = new Table({
      ...(commonTableArg({
        top: PIE_CHART_HEIGHT,
        height: TOTAL_DURATION_TABLE_HEIGHT,
      }) as any),
      columns: ["name", "type", { label: "total duration", name: "duration" }],
    });

    this.#dailyTable = new Table({
      debug,
      renderScreen,
      columns: ["name", "type", "duration", "from", "to"],
      position: { left: 0, top: DAILY_TABLE_TOP_POSITION },
      dimension: { width: CHILDREN_WIDTH, height: DAILY_SESSIONS_TABLE_HEIGHT },
      formatObject: (rowObject) => ({
        ...rowObject,
        duration: formatDuration(rowObject.duration),
      }),
    });

    // when not in daily view this element should overlap the
    // dailyTable element.
    this.#lineChart = new LineChart({
      debug,
      renderScreen,
      border: true,
      position: { top: DAILY_TABLE_TOP_POSITION },
      dimension: { width: CHILDREN_WIDTH, height: LINE_CHART_HEIGHT },
    });

    this.#wrapper.append(this.#pieChart.element);
    this.#wrapper.append(this.#dailyTable.element);
    this.#wrapper.append(this.#totalDurationTable.element);
    this.#wrapper.append(this.#lineChart.element);

    this.#pieChart.element.hide();
    this.#dailyTable.element.hide();
    this.#lineChart.element.hide();
    this.#totalDurationTable.element.hide();

    this.#wrapper.on("keypress", ((_, key) => {
      if (!("name" in key) || !key.full || key.ctrl) return true;

      switch (key.full) {
        case "S-m":
          this.#setViewType(StatsViewType.MONTHLY);
          break;
        case "S-y":
          this.#setViewType(StatsViewType.YEARLY);
          break;
        case "S-w":
          this.#setViewType(StatsViewType.WEEKLY);
          break;

        case "S-d":
          this.#setViewType(StatsViewType.DAILY);
          break;
      }

      return true;
    }) as BlessedKeypressHandler);
  }

  setDate(date: Date) {
    if (this.#date && isSameDay(date, this.#date)) return;

    this.#date = date;
    this.#fetchAndRenderStats();
  }

  #setViewType(viewType: StatsViewType) {
    if (!this.#date)
      this.#alert({ text: "Please select a date first.", type: "error" });

    if (viewType === this.#viewType) return;

    this.#viewType = viewType;
    this.#fetchAndRenderStats();
  }

  #updatePieChart(aggregated: AggregatedEntry[]) {
    this.#pieChart.setItems(
      aggregated.map(({ label, duration }) => ({ label, value: duration }))
    );
    this.#pieChart.element.show();
  }

  #updateTotalDurationTable(aggregated: AggregatedEntry[]) {
    this.#totalDurationTable.updateRows({
      rowObjects: aggregated
        .map((entry) => pick(entry, ["name", "type", "duration"]))
        .sort(({ duration: a }, { duration: b }) => b - a),
    });

    this.#totalDurationTable.element.show();
  }

  #updateDailyTable(workSessions: ReadonlyDeep<StatsWorkSession[]>) {
    this.#dailyTable.updateRows({
      rowObjects: [...workSessions]
        .sort(
          ({ events: eA }, { events: eB }) => eA[0].timestamp - eB[0].timestamp
        )
        .map(({ elapsedTime, ref, events }) => ({
          name: ref.name,
          type: ref.type,
          duration: elapsedTime.total,
          from: timestampToLocaleTimeString(events[0].timestamp),
          to: timestampToLocaleTimeString(last(events)!.timestamp),
        })),
    });

    this.#dailyTable.element.show();
  }

  #fetchAndRenderStats() {
    if (!this.#date) return;

    if (this.#viewType === StatsViewType.DAILY) this.#showDailyStats();
    else this.#showNonDailyStats();
  }

  async #showDailyStats() {
    if (!this.#date) return;

    const workSessions = await this.#fetchWorkSessions({
      date: toLocaleDateString(this.#date),
    });

    if (!workSessions) return;

    const aggregated = aggregateWorkSessions({
      entries: workSessions,
      getRef: (ws) => ws.ref,
      getTotalDuration: (ws) => ws.elapsedTime.total,
    }).sort(({ duration: a }, { duration: b }) => a - b);

    this.#updatePieChart(aggregated);
    this.#updateTotalDurationTable(aggregated);
    this.#updateDailyTable(workSessions);

    this.#lineChart.element.hide();

    this.#setLabel({
      totalWorkMs: aggregated.reduce(
        (total, { duration }) => total + duration,
        0
      ),
    });

    this.#wrapper.scrollTo(0);
  }

  async #showNonDailyStats() {
    if (!this.#date) return;

    const statsSummary = await this.#fetchStatsSummary();
    if (!statsSummary) return;

    const statsRange = getDateRangeByStatsViewType({
      currentDate: this.#date,
      viewType: this.#viewType,
      weekStartsOn: this.#indexOfFirstDayOfWeek as any,
    });

    const stats = Object.values(statsSummary)
      .filter(
        ({ date: dateTimestamp }) =>
          dateTimestamp >= statsRange.start.getTime() &&
          dateTimestamp <= statsRange.end.getTime()
      )
      .sort(({ date: a }, { date: b }) => a - b);

    const totalDuration = stats.reduce(
      (total, { totalDurationMs }) => total + totalDurationMs,
      0
    );

    const aggregated = aggregateWorkSessions({
      getRef: ({ ref }) => ref,
      getTotalDuration: ({ duration }) => duration,
      entries: stats.map(({ durationPerRefs }) => durationPerRefs).flat(),
    });

    this.#updatePieChart(aggregated);
    this.#updateTotalDurationTable(aggregated);
    this.#updateLineChart({
      stats,
      range: statsRange,
      viewType: this.#viewType,
    });

    this.#dailyTable.element.hide();

    this.#setLabel({ totalWorkMs: totalDuration, range: statsRange });
    this.#wrapper.scrollTo(0);
  }

  #updateLineChart(arg: {
    range: DateRange;
    viewType: StatsViewType;
    stats: ReadonlyDeep<DailyStat[]>;
  }) {
    const { stats, viewType, range: statsRange } = arg;

    const formattedStats = stats.map(
      ({ date: dateTimestamp, totalDurationMs }) => ({
        durationInHour: convertDuration({
          toUnit: "h",
          fromUnit: "ms",
          duration: totalDurationMs,
        }),
        date: new Date(dateTimestamp),
      })
    );

    this.#lineChart.element.show();

    if (viewType === StatsViewType.YEARLY) {
      const totalDurationPerMonth = formattedStats.reduce(
        (aggregated, { date, durationInHour }) => {
          const monthIndex = date.getMonth();

          if (!aggregated[monthIndex]) aggregated[monthIndex] = 0;
          aggregated[monthIndex] += durationInHour;

          return aggregated;
        },
        {} as { [monthIndex: number]: number }
      );

      const lineData = MONTHS_NAMES.map((name, monthIndex) => ({
        label: name.slice(0, 3),
        value: totalDurationPerMonth[monthIndex] || 0,
      }));

      this.#lineChart.setData(lineData);
      return;
    }

    const totalDurationPerDate = formattedStats.reduce((aggregated, entry) => {
      aggregated[entry.date.toLocaleDateString()] = entry;
      return aggregated;
    }, {} as { [date: string]: { durationInHour: number; date: Date } });

    const lineData = eachDayOfInterval(statsRange).map((date) => {
      const entry = totalDurationPerDate[date.toLocaleDateString()];
      const label = date.getDate().toString();

      return entry
        ? { label, value: entry.durationInHour }
        : { label, value: 0 };
    });

    this.#lineChart.setData(lineData);
  }

  #setLabel(arg: { totalWorkMs?: number; range?: DateRange } = {}) {
    const { totalWorkMs, range } = arg;

    let label = "";

    if (this.#date) {
      let dateStr = "";

      if (this.#viewType === StatsViewType.WEEKLY && range) {
        const formatPattern = dateForLabelFormatPattern[StatsViewType.WEEKLY];

        const startDate = formatDate(range.start, formatPattern);
        const endDate = formatDate(range.end, formatPattern);

        dateStr = `${startDate} to ${endDate}`;
      } else
        dateStr = formatDate(
          this.#date,
          dateForLabelFormatPattern[this.#viewType]
        );

      label = `${dateStr} | stats: ${this.#viewType}`;
    } else label = `stats: ${this.#viewType}`;

    if (typeof totalWorkMs === "number")
      label += ` | total: ${formatDuration(totalWorkMs)}`;

    this.#wrapper.setLabel({ text: `[${label}]`, side: "right" });
    this.#renderScreen();
  }

  set firstDayOfWeek(dayIndex: number) {
    this.#indexOfFirstDayOfWeek = dayIndex;
  }

  get element() {
    return this.#wrapper;
  }

  get children() {
    return [
      this.#wrapper,
      this.#pieChart.element,
      this.#totalDurationTable.element,
      this.#dailyTable.element,
      this.#lineChart.element,
    ];
  }
}

function getDateRangeByStatsViewType(arg: {
  currentDate: Date;
  viewType: StatsViewType;
  weekStartsOn: number;
}): DateRange {
  const { currentDate, viewType, weekStartsOn } = arg;

  switch (viewType) {
    case StatsViewType.WEEKLY:
      return {
        // @ts-ignore
        end: endOfWeek(currentDate, { weekStartsOn }),
        // @ts-ignore
        start: startOfWeek(currentDate, { weekStartsOn }),
      };

    case StatsViewType.MONTHLY:
      return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };

    case StatsViewType.YEARLY:
      return { start: startOfYear(currentDate), end: endOfYear(currentDate) };

    default:
      throw new Error(`Invalid stats viewType: "${viewType}"`);
  }
}

function aggregateWorkSessions<T extends object>(arg: {
  entries: ReadonlyDeep<T[]>;
  getRef(entry: ReadonlyDeep<T>): TimerRefWithName;
  getTotalDuration(entry: ReadonlyDeep<T>): number;
}): AggregatedEntry[] {
  const aggregated: {
    [refLabel: string]: AggregatedEntry;
  } = {};

  const { entries, getRef, getTotalDuration } = arg;

  entries.forEach((entry) => {
    const ref = getRef(entry);
    const label = getRefLabel(ref);

    if (!aggregated[label])
      aggregated[label] = {
        label,
        duration: 0,
        name: ref.name,
        type: ref.type,
      };

    aggregated[label].duration += getTotalDuration(entry);
  });

  return Object.values(aggregated);
}

function getRefLabel(ref: TimerRefWithName) {
  return `${ref.type[0]}(${ref.id})/${ref.name}`;
}
