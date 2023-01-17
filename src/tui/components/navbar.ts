import blessed from "blessed";
import { merge } from "common/util/merge";
import { getCircularArrayIndex } from "common/util/other";

import type { Widgets } from "blessed";
import type { BGAndFGColor, Debug } from "../interface";
import type { PartialDeep, ReadonlyDeep } from "type-fest";

export type NavigationBarStyles = Pick<BGAndFGColor, "bg"> & {
  items: BGAndFGColor;
  selected: BGAndFGColor;
};

export interface NavigationBar_Argument {
  debug: Debug;
  tabs: string[];
  selected?: string;
  align?: "center" | "left" | "right";
  style?: PartialDeep<NavigationBarStyles>;
}

export type OnTabChange = (arg: { index: number; name: string }) => void;

export class NavigationBar {
  readonly #debug: Debug;
  readonly #tabs: readonly string[];
  readonly #element: Widgets.BoxElement;
  readonly #styles: ReadonlyDeep<NavigationBarStyles> = Object.freeze({
    bg: "gray",
    items: { bg: "gray", fg: "white" },
    selected: { bg: "black", fg: "white" },
  });

  #onChange: OnTabChange = () => {};

  #selectedIndex = 0;

  constructor(arg: NavigationBar_Argument) {
    this.#debug = arg.debug;
    this.#tabs = Object.freeze([...arg.tabs]);
    this.#styles = merge(this.#styles, arg.style || {});

    if ("selected" in arg)
      this.#selectedIndex = this.#findTabByName(arg.selected!);

    this.#element = blessed.box({
      top: 0,
      height: 1,
      tags: true,
      scrollable: false,
      bg: this.#styles.bg,
      align: arg.align || "left",
    });

    this.#renderText();
  }

  #renderText() {
    const content = this.#tabs
      .map((tab, index) => {
        const numbered = ` ${index + 1} ${tab} `;

        return this.#formatTabText({
          text: numbered,
          selected: index === this.#selectedIndex,
        });
      })
      .join("");

    this.#element.setContent(content);
  }

  #formatTabText(arg: { text: string; selected: boolean }) {
    const { fg: fgColor, bg: bgColor } = arg.selected
      ? this.#styles.selected
      : this.#styles.items;
    return `{${fgColor}-fg}{${bgColor}-bg}${arg.text}{/}{/}`;
  }

  #findTabByName(name: string) {
    const index = this.#tabs.findIndex((tab) => tab === name);
    if (index === -1) throw new Error(`Couldn't find any tab named "${name}"`);
    return index;
  }

  move(arg: { index: number } | { offset: number } | { name: string }) {
    if ("index" in arg) this.#selectedIndex = arg.index;
    else if ("name" in arg) this.#selectedIndex = this.#findTabByName(arg.name);
    else if ("offset" in arg)
      this.#selectedIndex = getCircularArrayIndex({
        offset: arg.offset,
        length: this.#tabs.length,
        index: this.#selectedIndex,
      });
    else throw new Error(`Invalid move argument.`);

    this.#renderText();
    this.#onChange({
      index: this.#selectedIndex,
      name: this.#tabs[this.#selectedIndex],
    });
  }

  get selected() {
    return this.#tabs[this.#selectedIndex];
  }

  get element() {
    return this.#element;
  }

  set onChange(onChange: OnTabChange) {
    this.#onChange = onChange;
  }
}
