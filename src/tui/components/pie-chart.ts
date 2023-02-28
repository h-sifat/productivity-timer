// @ts-expect-error no type definition
import Pie from "cli-pie";
// @ts-expect-error no type definition
import FlatColors from "flat-colors";

import blessed from "blessed";
import type { Widgets } from "blessed";
import { pickDimensionalProps, pickPositionalProps } from "tui/util/other";
import type { Debug, ElementDimension, ElementPosition } from "tui/interface";

export interface PieChart_Argument {
  debug: Debug;
  border?: boolean;
  renderScreen(): void;
  position?: ElementPosition;
  dimension?: ElementDimension;
}
export type PieChartItem = { label: string; value: number; color?: number[] };

const MAX_LABEL_LENGTH = 18;

export class PieChart {
  #debug: Debug;
  #renderScreen: () => void;

  #element: Widgets.BoxElement;
  #pieRadius = 7;

  #items: PieChartItem[] = [];

  constructor(arg: PieChart_Argument) {
    this.#debug = arg.debug;
    this.#renderScreen = arg.renderScreen;

    this.#element = blessed.box({
      mouse: true,
      focusable: true,
      scrollable: true,
      border: arg.border ? "line" : undefined,
      ...pickPositionalProps(arg.position),
      ...pickDimensionalProps(arg.dimension),
      scrollbar: { ch: " ", style: { fg: "white", bg: "grey" } },
    });

    const resizePie = () => {
      const parent = this.#element.parent;
      const width = (parent as any)?.width;
      if (!width) return;

      this.#pieRadius = getPieChartRadius(width);
      this.#renderPieChart();
    };

    this.#element.on("resize", resizePie);
    this.#element.once("render", resizePie);
  }

  setItems(items: PieChartItem[]) {
    this.#items = items.map((item) => {
      item.color = FlatColors().slice(0, 3);
      if (item.label.length > MAX_LABEL_LENGTH)
        item.label = item.label.slice(0, MAX_LABEL_LENGTH);

      return item;
    });

    this.#renderPieChart();
  }

  #renderPieChart() {
    const pie = new Pie(this.#pieRadius, this.#items, { legend: true });
    this.#element.setContent(pie.toString());

    this.#renderScreen();
  }

  get element() {
    return this.#element;
  }
}

export function getPieChartRadius(width: number) {
  if (width > 70) return 7;
  else if (width > 60) return 6;
  else if (width > 55) return 5;
  else return 3;
}
