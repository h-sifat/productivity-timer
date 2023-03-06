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
      this.#focusChild({ node: "current" });
    });
  }

  #focusChild(arg: { node: "prev" | "next" | "current" }) {
    if (!this.#focusArray.length) return;

    const { node } = arg;

    if (node === "current")
      return void this.#focusChildNodeAtIndex(this.#focusedIndex);
    if (this.#focusArray.length === 1)
      return void this.#focusChildNodeAtIndex(0);

    const startIndex = this.#focusedIndex;

    let currentIndex = startIndex;
    while (true) {
      currentIndex = getCircularArrayIndex({
        index: currentIndex,
        length: this.#focusArray.length,
        offset: node === "next" ? 1 : -1,
      });

      if (currentIndex === startIndex) return;

      const isFocusSuccessful = this.#focusChildNodeAtIndex(currentIndex);

      if (isFocusSuccessful) {
        this.#focusedIndex = currentIndex;
        return;
      }
    }
  }

  #focusChildNodeAtIndex(index: number) {
    const element = this.#focusArray[index];
    if (!element || element.hidden) return false;

    try {
      element.focus();

      // blessed doesn't always automatically bring the focused element to the
      // visible area. That's why I'm manually doing the scrolling.
      const scrollPos = <number>element.atop + <number>element.height;
      // @ts-ignore
      element.parent.scrollTo(scrollPos);
    } catch {}

    this.#renderScreen();
    return true;
  }

  get element() {
    return this.#wrapperBox;
  }

  focusNext() {
    this.#focusChild({ node: "next" });
  }

  focusPrev() {
    this.#focusChild({ node: "prev" });
  }

  show() {
    if (!this.#wrapperBox.hidden) return;

    this.#wrapperBox.show();
    // this.#wrapperBox.focus();
    this.#focusChild({ node: "current" });
  }

  hide() {
    if (!this.#wrapperBox.hidden) this.#wrapperBox.hide();
  }
}
