import blessed from "blessed";
import type { Widgets } from "blessed";
import { Debug, ElementPosition } from "../interface";
import { getCircularArrayIndex } from "common/util/other";

export type Page_Argument = {
  debug: Debug;
  children: Widgets.Node[];
} & ElementPosition;

export class Page {
  #focusedIndex = 0;
  readonly #debug: Debug;
  readonly #wrapperBox: Widgets.BoxElement;

  constructor(arg: Page_Argument) {
    const { debug, ...rest } = arg;
    this.#debug = debug;
    this.#wrapperBox = blessed.box({
      ...rest,
      mouse: true,
      scrollable: true,
    });
    this.hide();

    this.#wrapperBox.once("render", () => {
      this.#focusSelectedChild();
    });
  }

  #focusSelectedChild() {
    if (this.#wrapperBox.children.length)
      // @ts-ignore
      this.#wrapperBox.children[this.#focusedIndex].focus();
  }

  get element() {
    return this.#wrapperBox;
  }

  focusNext() {
    this.#focusedIndex = getCircularArrayIndex({
      offset: 1,
      index: this.#focusedIndex,
      length: this.#wrapperBox.children.length,
    });

    this.#focusSelectedChild();
  }

  focusPrev() {
    this.#focusedIndex = getCircularArrayIndex({
      offset: -1,
      index: this.#focusedIndex,
      length: this.#wrapperBox.children.length,
    });

    this.#focusSelectedChild();
  }

  show() {
    if (!this.#wrapperBox.hidden) return;

    this.#wrapperBox.show();
    this.#wrapperBox.focus();
    this.#focusSelectedChild();
  }

  hide() {
    if (!this.#wrapperBox.hidden) this.#wrapperBox.hide();
  }
}
