import type { Widgets } from "blessed";
import type { ReadonlyDeep } from "type-fest";
import type { PieItem } from "cli/commands/stats";
import type { DailyStat } from "use-cases/interfaces/work-session-db";
import type { TimerRefWithName } from "src/controllers/timer/interface";
import type { WorkSessionFields } from "entities/work-session/work-session";
import type { Debug, ElementDimension, ElementPosition } from "tui/interface";

import blessed from "blessed";
import { PieChart } from "tui/components/pie-chart";
import { toLocaleDateString } from "common/util/date-time";
import { pickDimensionalProps, pickPositionalProps } from "tui/util/other";
import { isSameDay } from "date-fns";

export interface Stats_Argument {
  debug: Debug;
  renderScreen(): void;
  position?: ElementPosition;
  dimension?: ElementDimension;
  fetchWorkSessions: FetchWorkSessions;
  // fetchStatsSummary: FetchStatsSummary;
}

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
  static readonly PIE_CHART_HEIGHT = 20;

  readonly #debug: Debug;
  readonly #renderScreen: () => void;
  readonly #fetchWorkSessions: FetchWorkSessions;
  // readonly #fetchStatsSummary: FetchStatsSummary;

  readonly #wrapper: Widgets.BoxElement;
  readonly #pieChart: PieChart;

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
      ...pickPositionalProps(arg.position),
      ...pickDimensionalProps(arg.dimension),
      style: { focus: { border: { fg: "green" } } },
      scrollbar: { ch: " ", style: { fg: "white", bg: "grey" } },
    });

    this.#pieChart = new PieChart({
      debug,
      renderScreen,
      border: false,
      dimension: { height: StatsComponent.PIE_CHART_HEIGHT },
    });

    this.#wrapper.append(this.#pieChart.element);
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

    this.#pieChart.setItems(aggregateWorkSessions(workSessions));
  }

  get element() {
    return this.#wrapper;
  }
}

function aggregateWorkSessions(
  workSessions: ReadonlyDeep<StatsWorkSession[]>
): PieItem[] {
  const aggregated: { [refLabel: string]: number } = {};

  workSessions.forEach((workSession) => {
    const label = getRefLabel(workSession.ref);

    if (!aggregated[label]) aggregated[label] = 0;
    aggregated[label] += workSession.elapsedTime.total;
  });

  return Object.entries(aggregated).map(([label, value]) => ({ label, value }));
}

function getRefLabel(ref: TimerRefWithName) {
  return `${ref.type[0]}(${ref.id})/${ref.name}`;
}

/*
 * Stats.setDate(...)
 * Stats.viewType(monthly | daily | weekly)
 * */
