import blessed from "blessed";
import { merge } from "common/util/merge";
import { deepFreeze, getCircularArrayIndex } from "common/util/other";

import type { Widgets } from "blessed";
import type { PartialDeep, ReadonlyDeep } from "type-fest";
import type { BGAndFGColor, Debug, ElementPosition } from "../interface";

export type NavigationBarStyles = Pick<BGAndFGColor, "bg"> & {
  items: BGAndFGColor;
  selected: BGAndFGColor;
};

export interface NavigationBar_Argument {
  debug: Debug;
  selected?: string;
  position?: ElementPosition;
  showTabSerialNumber: boolean;
  align?: "center" | "left" | "right";
  style?: PartialDeep<NavigationBarStyles>;
  tabs: ({ name: string; label: string } | string)[];
}

export type OnTabChange = (arg: { index: number; name: string }) => void;

const defaultStyles = deepFreeze({
  bg: "gray",
  items: { bg: "gray", fg: "white" },
  selected: { bg: "black", fg: "white" },
});

export class NavigationBar {
  readonly #debug: Debug;
  readonly #element: Widgets.BoxElement;
  readonly #showTabSerialNumber: boolean;
  readonly #tabs: readonly Readonly<{ name: string; label: string }>[];
  readonly #styles: ReadonlyDeep<NavigationBarStyles>;

  #onChange: OnTabChange = () => {};

  #selectedIndex = 0;

  constructor(arg: NavigationBar_Argument) {
    this.#debug = arg.debug;
    this.#tabs = Object.freeze(
      arg.tabs.map((tab) =>
        typeof tab === "string"
          ? Object.freeze({ name: tab, label: tab })
          : Object.freeze({ ...tab })
      )
    );
    this.#styles = merge({}, defaultStyles, arg.style || {});
    this.#showTabSerialNumber = arg.showTabSerialNumber;

    if ("selected" in arg)
      this.#selectedIndex = this.#findTabByName(arg.selected!);

    this.#element = blessed.box({
      top: 0,
      ...(arg.position || {}),

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
      .map(({ label: tabLabel }, index) => {
        return this.#formatTabText({
          text: this.#showTabSerialNumber
            ? ` ${index + 1} ${tabLabel} `
            : ` ${tabLabel} `,
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
    const index = this.#tabs.findIndex((tab) => tab.name === name);
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
      name: this.#tabs[this.#selectedIndex].name,
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
