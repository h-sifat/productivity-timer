import type { widget } from "blessed-contrib";
import type { Debug, ElementDimension, ElementPosition } from "tui/interface";

import contrib from "blessed-contrib";
import { setLabelStyleOnFocusAndBlur } from "tui/util/label-style-setter";
import { pickDimensionalProps, pickPositionalProps } from "tui/util/other";

export interface LineChart_Argument {
  debug: Debug;
  label?: string;
  border?: boolean;
  renderScreen(): void;
  position?: ElementPosition;
  dimension?: ElementDimension;
}

export type setData_Arg = {
  label: string;
  value: number;
}[];

export class LineChart {
  #debug: Debug;
  #renderScreen: () => void;

  #lineElement: widget.Line;

  constructor(arg: LineChart_Argument) {
    this.#debug = arg.debug;
    this.#renderScreen = arg.renderScreen;

    {
      const { label } = arg;

      this.#lineElement = contrib.line({
        label: <any>label,
        ...pickPositionalProps(arg.position),
        ...pickDimensionalProps(arg.dimension),
        border: arg.border ? "line" : undefined,

        xPadding: 5,
        xLabelPadding: 3,

        style: {
          line: "green",
          text: "green",
          baseline: "black",
          // @ts-ignore
          border: { fg: "white" },
          // @ts-ignore Come on, stop complaining
          focus: { border: { fg: "green" } },
        },
      });
    }

    setLabelStyleOnFocusAndBlur({
      blurStyle: { fg: "white" },
      focusStyle: { fg: "green" },
      element: this.#lineElement,
      renderScreen: this.#renderScreen,
    });
  }

  setData(data: setData_Arg) {
    const processedData = data.reduce(
      (lineData, entry) => {
        lineData.x.push(entry.label);
        lineData.y.push(entry.value);

        return lineData;
      },
      { x: [], y: [] } as { x: string[]; y: number[] }
    );

    this.#lineElement.setData([processedData]);
    this.#renderScreen();
  }

  setLabel(label: Parameters<widget.Line["setLabel"]>[0]) {
    this.#lineElement.setLabel(label);
  }

  get element() {
    return this.#lineElement;
  }
}
