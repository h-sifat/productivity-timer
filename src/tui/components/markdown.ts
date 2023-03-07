import contrib, { Widgets } from "blessed-contrib";
import { pickDimensionalProps, pickPositionalProps } from "tui/util/other";

import type { Debug, ElementDimension, ElementPosition } from "tui/interface";

export interface Markdown_Argument {
  debug: Debug;
  label?: string;
  border?: boolean;
  padding?: number;
  renderScreen(): void;
  position?: ElementPosition;
  dimension?: ElementDimension;
}

export class Markdown {
  #debug: Debug;
  #renderScreen: () => void;

  #element: Widgets.MarkdownElement;

  constructor(arg: Markdown_Argument) {
    this.#debug = arg.debug;
    this.#renderScreen = arg.renderScreen;

    {
      const { label, position = {}, dimension = {}, padding = 1 } = arg;

      this.#element = contrib.markdown({
        ...pickPositionalProps(position),
        ...pickDimensionalProps(dimension),

        padding,
        label: <any>label,

        mouse: true,
        keyable: true,

        border: arg.border ? "line" : undefined,

        scrollable: true,
        scrollbar: { ch: " ", style: { bg: "grey" } },

        style: {
          fg: "white",
          border: { fg: "white" },
          focus: { border: { fg: "green" } },
        },
      });
    }

    this.#element.key(["j", "down"], () => {
      this.#element.scroll(3);
      this.#renderScreen();
    });

    this.#element.key(["k", "up"], () => {
      this.#element.scroll(-3);
      this.#renderScreen();
    });
  }

  setMarkdown(md: string) {
    this.#element.setMarkdown(md);
    this.#renderScreen();
  }

  get element() {
    return this.#element;
  }
}
