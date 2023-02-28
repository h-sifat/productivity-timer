import blessed from "blessed";
import type { Widgets } from "blessed";
import { Debug, ElementPosition } from "../interface";
import { getCircularArrayIndex } from "common/util/other";

export type Page_Argument = {
  debug: Debug;
  children: Widgets.Node[];
  focusArray?: Widgets.Node[];
} & ElementPosition;

export class Page {
  #focusedIndex = 0;
  readonly #debug: Debug;
  readonly #focusArray: Widgets.Node[];
  readonly #wrapperBox: Widgets.BoxElement;

  constructor(arg: Page_Argument) {
    const { debug, children, focusArray = [], ...rest } = arg;

    this.#focusArray =
      Array.isArray(focusArray) && focusArray.length ? focusArray : children;

    this.#debug = debug;
    this.#wrapperBox = blessed.box({
      ...rest,
      children,
      mouse: true,
      scrollable: true,
    });
    this.hide();

    this.#wrapperBox.once("render", () => {
      this.#focusSelectedChild();
    });
  }

  #focusSelectedChild() {
    if (this.#focusArray.length)
      // @ts-ignore
      this.#focusArray[this.#focusedIndex].focus();
  }

  get element() {
    return this.#wrapperBox;
  }

  focusNext() {
    this.#focusedIndex = getCircularArrayIndex({
      offset: 1,
      index: this.#focusedIndex,
      length: this.#focusArray.length,
    });

    this.#focusSelectedChild();
  }

  focusPrev() {
    this.#focusedIndex = getCircularArrayIndex({
      offset: -1,
      index: this.#focusedIndex,
      length: this.#focusArray.length,
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
