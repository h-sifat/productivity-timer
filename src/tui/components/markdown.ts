import blessed, { Widgets as BlessedWidgets } from "blessed";
import contrib, { Widgets as ContribWidgets } from "blessed-contrib";
import { pickDimensionalProps, pickPositionalProps } from "tui/util/other";

import type { Debug, ElementDimension, ElementPosition } from "tui/interface";
import { createInstructionsBox } from "./instructions";

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

  #mdElement: ContribWidgets.MarkdownElement;
  #wrapper: BlessedWidgets.BoxElement;

  constructor(arg: Markdown_Argument) {
    this.#debug = arg.debug;
    this.#renderScreen = arg.renderScreen;

    {
      const { label, position = {}, dimension = {}, padding = 1 } = arg;

      this.#wrapper = blessed.box({
        label: <any>label,
        ...pickPositionalProps(position),
        ...pickDimensionalProps(dimension),

        border: arg.border ? "line" : undefined,

        style: {
          fg: "white",
          border: { fg: "white" },
          focus: { border: { fg: "green" } },
        },
      });

      this.#mdElement = contrib.markdown({
        parent: this.#wrapper,

        top: 0,
        bottom: 1,
        padding,

        mouse: true,
        keyable: true,
        focusable: false,

        scrollable: true,
        scrollbar: { ch: " ", style: { bg: "grey" } },

        style: {
          fg: "white",
          border: { fg: "white" },
          focus: { border: { fg: "green" } },
        },
      });
    }

    createInstructionsBox({
      bottom: 0,
      height: 1,
      border: false,
      align: "center",
      parent: this.#wrapper,
      instructions: {
        "j/down": "scroll down",
        "k/up": "scroll up",
        "mouse wheel": "also works",
      },
    });

    this.#wrapper.key(["j", "down"], () => {
      this.#mdElement.scroll(3);
      this.#renderScreen();
    });

    this.#wrapper.key(["k", "up"], () => {
      this.#mdElement.scroll(-3);
      this.#renderScreen();
    });
  }

  setMarkdown(md: string) {
    this.#mdElement.setMarkdown(md);
    this.#renderScreen();
  }

  get element() {
    return this.#wrapper;
  }
}
