import blessed from "blessed";
import { PartialDeep } from "type-fest";
import { merge } from "common/util/merge";
import { deepFreeze } from "common/util/other";
import { createInstructionsBox } from "./instructions";
import { BGAndFGColor, BlessedElementStyle } from "../interface";

export interface SuggestionElement_Arg {
  height?: number;
  zIndex?: number;
  renderScreen(): void;
  top?: number | string;
  left?: number | string;
  suggestions?: string[];
  right?: number | string;
  bottom?: number | string;
  parent?: blessed.Widgets.Node;
  instructions?: { [k: string]: string | number };
  listStyle?: PartialDeep<BlessedElementStyle & { selected: BGAndFGColor }>;
}

const defaultListStyle = deepFreeze({
  scrollbar: { bg: "white" },
  selected: { bg: "green", fg: "white" },
});

export class SuggestionsElement {
  #selectedIndex = 0;
  #suggestions: string[] = [];
  readonly #renderScreen: () => void;
  readonly #listElement: blessed.Widgets.ListElement;
  readonly #wrapperElement: blessed.Widgets.BoxElement;

  constructor(arg: SuggestionElement_Arg) {
    const {
      instructions,
      renderScreen,
      listStyle = {},
      suggestions = [],
      height: wrapperHeight = 6,
      zIndex: wrapperZIndex = 0,
      ...rest
    } = arg;
    this.#suggestions = suggestions;
    this.#renderScreen = renderScreen;

    if (wrapperHeight < 5) throw new Error(`The height must be >= 5`);

    this.#wrapperElement = blessed.box({
      height: wrapperHeight,
      ...rest,
      border: "line",
    });

    this.#wrapperElement.setIndex(wrapperZIndex);

    {
      let listHeight = wrapperHeight - /* border */ 2;
      if (arg.instructions) listHeight -= /* instructions */ 1;

      const mergedListStyle = merge({}, defaultListStyle, listStyle);

      this.#listElement = blessed.list({
        keys: false,
        mouse: false,
        scrollable: true,
        height: listHeight,
        items: suggestions,
        scrollbar: { ch: " " },
        parent: this.#wrapperElement,
        style: mergedListStyle as any,
      });
    }

    if (instructions)
      createInstructionsBox({
        left: 0,
        right: 0,
        bottom: 0,
        height: 1,
        instructions,
        parent: this.#wrapperElement,
      });
  }

  scrollUp() {
    if (!this.#suggestions.length || this.#selectedIndex <= 0) return;

    this.#selectedIndex--;
    this.#listElement.up(1);

    this.#renderScreen();
  }

  scrollDown() {
    if (
      !this.#suggestions.length ||
      this.#selectedIndex >= this.#suggestions.length - 1
    )
      return;

    this.#selectedIndex++;
    this.#listElement.down(1);

    this.#renderScreen();
  }

  clear() {
    this.#suggestions = [];
    this.#selectedIndex = 0;
    this.#listElement.clearItems();
    this.#renderScreen();
  }

  hide() {
    this.#wrapperElement.hide();
  }

  show() {
    this.#wrapperElement.show();
  }

  get hidden() {
    return this.#wrapperElement.hidden;
  }

  set suggestions(suggestions: string[]) {
    this.#suggestions = [...suggestions];
    // @ts-ignore
    this.#listElement.setItems(this.#suggestions);
    this.#selectedIndex = 0;
    this.show();
    this.#renderScreen();
  }

  get selected() {
    return this.#suggestions[this.#selectedIndex];
  }

  get element() {
    return this.#wrapperElement;
  }
}
