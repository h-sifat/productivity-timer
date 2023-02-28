import type { Widgets } from "blessed";
import type { ReadonlyDeep } from "type-fest";
import type { DailyStat } from "use-cases/interfaces/work-session-db";
import type { TimerRefWithName } from "src/controllers/timer/interface";
import type { WorkSessionFields } from "entities/work-session/work-session";
import type { Debug, ElementDimension, ElementPosition } from "tui/interface";

import blessed from "blessed";
import { isSameDay } from "date-fns";
import { PieChart } from "tui/components/pie-chart";
import {
  formatDurationMsAsHMS,
  toLocaleDateString,
} from "common/util/date-time";
import { pickDimensionalProps, pickPositionalProps } from "tui/util/other";
import { Table } from "tui/components/table";
import { formatDuration } from "cli/util/timer";

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

  readonly #debug: Debug;
  readonly #renderScreen: () => void;
  readonly #fetchWorkSessions: FetchWorkSessions;
  // readonly #fetchStatsSummary: FetchStatsSummary;

  readonly #wrapper: Widgets.BoxElement;
  readonly #pieChart: PieChart;
  readonly #table: Table<Pick<AggregatedEntry, "name" | "type" | "duration">>;

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
      style: { focus: { border: { fg: "green" } } },
      scrollbar: { ch: " ", style: { fg: "white", bg: "grey" } },
    });

    this.#pieChart = new PieChart({
      debug,
      renderScreen,
      border: false,
      dimension: { height: StatsComponent.PIE_CHART_HEIGHT, width: "100%-3" },
    });

    this.#table = new Table({
      debug,
      renderScreen,
      columns: ["name", "type", "duration"],
      dimension: { height: 15, width: "100%-3" },
      position: { left: 0, top: StatsComponent.PIE_CHART_HEIGHT },
      formatObject: (rowObject) => ({
        ...rowObject,
        duration: formatDuration(rowObject.duration),
      }),
    });

    this.#wrapper.append(this.#pieChart.element);
    this.#wrapper.append(this.#table.element);
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

    this.#table.updateRows({
      rowObjects: aggregated.map(({ name, duration, type }) => ({
        name,
        type,
        duration,
      })),
    });
  }

  get element() {
    return this.#wrapper;
  }

  get children() {
    return [this.#pieChart.element, this.#table.element];
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

/*
 * Stats.setDate(...)
 * Stats.viewType(monthly | daily | weekly)
 * */
