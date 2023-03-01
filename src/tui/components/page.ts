import blessed from "blessed";
import { getCircularArrayIndex } from "common/util/other";

import type { Widgets } from "blessed";
import type { Debug, ElementPosition } from "../interface";

export type Page_Argument = {
  debug: Debug;
  children: Widgets.BlessedElement[];
  focusArray?: Widgets.BlessedElement[];
  renderScreen(): void;
} & ElementPosition;

export class Page {
  #focusedIndex = 0;
  readonly #debug: Debug;
  readonly #renderScreen: () => void;
  readonly #focusArray: Widgets.BlessedElement[];
  readonly #wrapperBox: Widgets.BoxElement;

  constructor(arg: Page_Argument) {
    const { debug, children, focusArray = [], ...rest } = arg;

    this.#focusArray =
      Array.isArray(focusArray) && focusArray.length ? focusArray : children;

    this.#debug = debug;
    this.#renderScreen = arg.renderScreen;

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
    if (!this.#focusArray.length) return;

    const element = this.#focusArray[this.#focusedIndex];
    if (!element) return;

    element.focus();

    // blessed doesn't always automatically bring the focused element to the
    // visible area. That's why I'm manually doing the scrolling.
    try {
      const scrollPos = <number>element.atop + <number>element.height;
      // @ts-ignore
      element.parent.scrollTo(scrollPos);
    } catch {}

    this.#renderScreen();
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
