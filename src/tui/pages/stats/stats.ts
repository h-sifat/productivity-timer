import type { Widgets } from "blessed";
import type { ReadonlyDeep } from "type-fest";
import type { DailyStat } from "use-cases/interfaces/work-session-db";
import type { TimerRefWithName } from "src/controllers/timer/interface";
import type { WorkSessionFields } from "entities/work-session/work-session";
import type { Debug, ElementDimension, ElementPosition } from "tui/interface";

import {
  toLocaleDateString,
  timestampToLocaleTimeString,
} from "common/util/date-time";
import blessed from "blessed";
import { last } from "lodash";
import { isSameDay } from "date-fns";
import { pick } from "common/util/other";
import { Table } from "tui/components/table";
import { formatDuration } from "cli/util/timer";
import { PieChart } from "tui/components/pie-chart";
import { pickDimensionalProps, pickPositionalProps } from "tui/util/other";

export interface Stats_Argument {
  debug: Debug;
  renderScreen(): void;
  position?: ElementPosition;
  dimension?: ElementDimension;
  fetchWorkSessions: FetchWorkSessions;
  // fetchStatsSummary: FetchStatsSummary;
}

type AggregatedEntry = Pick<TimerRefWithName, "type" | "name"> & {
  label: string;
  duration: number;
};

export type StatsWorkSession = WorkSessionFields<TimerRefWithName>;

export type FetchWorkSessions = (arg: {
  date: string;
}) => Promise<ReadonlyDeep<StatsWorkSession[]> | null>;
export type FetchStatsSummary = () => Promise<DailyStat>;

export enum StatsViewType {
  DAILY = "daily",
  WEEKLY = "weekly",
  YEARLY = "yearly",
  MONTHLY = "monthly",
}
Object.freeze(StatsViewType);

export class StatsComponent {
  static readonly PIE_CHART_HEIGHT = 19;
  static readonly DAILY_SESSIONS_TABLE_HEIGHT = 12;
  static readonly TOTAL_DURATION_TABLE_HEIGHT = 12;

  readonly #debug: Debug;
  readonly #renderScreen: () => void;
  readonly #fetchWorkSessions: FetchWorkSessions;
  // readonly #fetchStatsSummary: FetchStatsSummary;

  readonly #wrapper: Widgets.BoxElement;
  readonly #pieChart: PieChart;
  readonly #dailyTable: Table<
    Pick<AggregatedEntry, "name" | "type" | "duration"> &
      Record<"from" | "to", string>
  >;
  readonly #totalDurationTable: Table<
    Pick<AggregatedEntry, "name" | "type" | "duration">
  >;

  #date: Date | null = null;
  #viewType: StatsViewType = StatsViewType.DAILY;

  constructor(arg: Stats_Argument) {
    const { debug, renderScreen } = arg;
    this.#debug = arg.debug;
    this.#renderScreen = arg.renderScreen;
    this.#fetchWorkSessions = arg.fetchWorkSessions;
    // this.#fetchStatsSummary = arg.fetchStatsSummary;

    this.#wrapper = blessed.box({
      border: "line",
      scrollable: true,
      mouse: true,
      ...pickPositionalProps(arg.position),
      ...pickDimensionalProps(arg.dimension),
      style: { focus: { border: { fg: "green" } }, label: { fg: "green" } },
      scrollbar: { ch: " ", style: { fg: "white", bg: "grey" } },
    });

    this.#pieChart = new PieChart({
      debug,
      renderScreen,
      border: false,
      dimension: { height: StatsComponent.PIE_CHART_HEIGHT, width: "100%-3" },
    });

    const commonTableArg = ({
      top,
      height,
    }: {
      height: string | number;
      top: number | string;
    }) => ({
      debug,
      renderScreen,
      position: { left: 0, top },
      dimension: { height, width: "100%-3" },
      formatObject: (rowObject: { duration: number }) => ({
        ...rowObject,
        duration: formatDuration(rowObject.duration),
      }),
    });

    this.#totalDurationTable = new Table({
      ...(commonTableArg({
        top: StatsComponent.PIE_CHART_HEIGHT,
        height: StatsComponent.TOTAL_DURATION_TABLE_HEIGHT,
      }) as any),
      columns: ["name", "type", { label: "total duration", name: "duration" }],
    });

    this.#dailyTable = new Table({
      debug,
      renderScreen,
      dimension: {
        height: StatsComponent.DAILY_SESSIONS_TABLE_HEIGHT,
        width: "100%-3",
      },
      columns: ["name", "type", "duration", "from", "to"],
      position: {
        left: 0,
        top:
          StatsComponent.PIE_CHART_HEIGHT +
          StatsComponent.TOTAL_DURATION_TABLE_HEIGHT,
      },
      formatObject: (rowObject) => ({
        ...rowObject,
        duration: formatDuration(rowObject.duration),
      }),
    });

    this.#wrapper.append(this.#pieChart.element);
    this.#wrapper.append(this.#dailyTable.element);
    this.#wrapper.append(this.#totalDurationTable.element);
    // this.#pieChart.element.hide();
    // this.#dailyTable.element.hide();
  }

  setDate(date: Date) {
    if (this.#date && isSameDay(date, this.#date)) return;

    this.#date = date;
    this.#wrapper.setLabel({
      side: "center",
      text: `[${toLocaleDateString(this.#date)} | stats: ${this.#viewType}]`,
    });

    this.#fetchAndRenderStats();
  }

  #setViewType(viewType: StatsViewType) {
    this.#viewType = viewType;

    // @TODO fetch and render stats
  }

  async #fetchAndRenderStats() {
    if (!this.#date) return;
    if (this.#viewType !== StatsViewType.DAILY) return;

    const workSessions = await this.#fetchWorkSessions({
      date: toLocaleDateString(this.#date),
    });

    if (!workSessions) return;

    const aggregated = aggregateWorkSessions(workSessions).sort(
      ({ duration: a }, { duration: b }) => a - b
    );

    this.#pieChart.setItems(
      aggregated.map(({ label, duration }) => ({ label, value: duration }))
    );

    this.#totalDurationTable.updateRows({
      rowObjects: aggregated
        .map((entry) => pick(entry, ["name", "type", "duration"]))
        .sort(({ duration: a }, { duration: b }) => b - a),
    });

    // this.#pieChart.element.show();

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

    // this.#dailyTable.element.show();

    this.#setLabel(
      aggregated.reduce((total, { duration }) => total + duration, 0)
    );

    this.#wrapper.scrollTo(0);
  }

  #setLabel(totalWorkMs?: number) {
    if (!this.#date) return;

    let label = `${this.#date.toLocaleDateString()} | stats: ${this.#viewType}`;
    if (typeof totalWorkMs === "number")
      label += ` | total: ${formatDuration(totalWorkMs)}`;

    this.#wrapper.setLabel({ text: `[${label}]`, side: "right" });
    this.#renderScreen();
  }

  get element() {
    return this.#wrapper;
  }

  get children() {
    return [
      this.#pieChart.element,
      this.#totalDurationTable.element,
      this.#dailyTable.element,
    ];
  }
}

function aggregateWorkSessions(
  workSessions: ReadonlyDeep<StatsWorkSession[]>
): AggregatedEntry[] {
  const aggregated: {
    [refLabel: string]: AggregatedEntry;
  } = {};

  workSessions.forEach(({ ref, elapsedTime }) => {
    const label = getRefLabel(ref);

    if (!aggregated[label])
      aggregated[label] = {
        label,
        duration: 0,
        name: ref.name,
        type: ref.type,
      };
    aggregated[label].duration += elapsedTime.total;
  });

  return Object.values(aggregated);
}

function getRefLabel(ref: TimerRefWithName) {
  return `${ref.type[0]}(${ref.id})/${ref.name}`;
}
