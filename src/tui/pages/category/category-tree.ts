import blessed from "blessed";
import { Widgets } from "blessed";
import { merge } from "common/util/merge";
import { getTreeLines, TreeLine } from "./get-lines";
import { CategoryFields } from "entities/category/category";
import { buildCategoryTree } from "entities/category/build-tree";
import { createInstructionsBox } from "tui/components/instructions";
import { deepFreeze, getCircularArrayIndex, pick } from "common/util/other";

import type {
  Debug,
  BGAndFGColor,
  ElementPosition,
  ElementDimension,
  BlessedElementStyle,
} from "tui/interface";
import type { PartialDeep } from "type-fest";

export interface CategoryTree_Argument {
  debug: Debug;
  label?: string;
  renderScreen(): void;
  position?: ElementPosition;
  style?: BlessedElementStyle;
  dimension?: ElementDimension;
  additionalInstructions?: { [k: string]: string };
  listStyle?: PartialDeep<{ item: BGAndFGColor; selected: BGAndFGColor }>;
}

export const KeyBindings = Object.freeze({
  "k/up": "up",
  enter: "select",
  "j/down": "down",
  o: "toggle fold",
});

const defaultListStyle = deepFreeze({
  item: { fg: "green" },
  selected: { fg: "white", bg: "green" },
});

export type OnSelect = (arg: {
  index: number;
  category: CategoryFields | null;
}) => void;

export class CategoryTreeComponent {
  readonly #wrapper: Widgets.BoxElement;
  readonly #listElement: Widgets.ListElement;

  readonly #renderScreen: () => void;
  readonly #debug: Debug;

  #onSelect: OnSelect = () => {};
  #onCursorMove: OnSelect = () => {};

  #cursorIndex = 0;
  readonly #foldedCategoryIds: Set<string> = new Set();
  #treeLineObjects: readonly TreeLine[] = [];
  #categories: { readonly [id: string]: CategoryFields } = {};

  constructor(arg: CategoryTree_Argument) {
    this.#debug = arg.debug;
    this.#renderScreen = arg.renderScreen;

    {
      const {
        position = {},
        dimension = {},
        style = { focus: { border: { fg: "green" } } },
      } = arg;

      const boxArg: any = {
        style,
        border: "line",
        ...pick(dimension, ["width", "height"]),
        ...pick(position, ["top", "left", "bottom", "right"]),
      };

      if (arg.label) boxArg.label = arg.label;
      this.#wrapper = blessed.box(boxArg);
    }

    this.#listElement = blessed.list({
      top: 0,
      bottom: 2,
      tags: true,
      keys: false,
      mouse: false,
      parent: this.#wrapper,
      style: merge({}, defaultListStyle, arg.listStyle || {}),
      scrollbar: { ch: " ", track: { bg: "grey" }, style: { inverse: true } },
    });

    createInstructionsBox({
      bottom: 0,
      height: 1,
      border: false,
      align: "center",
      parent: this.#wrapper,
      instructions: { ...KeyBindings, ...arg.additionalInstructions },
    });

    this.#wrapper.key(["j", "down"], () => {
      this.moveCursor({ offset: 1, renderScreen: true });
    });

    this.#wrapper.key(["k", "up"], () => {
      this.moveCursor({ offset: -1, renderScreen: true });
    });

    this.#wrapper.key("o", () => {
      const selectedId = this.selected?.id;

      if (this.#foldedCategoryIds.has(selectedId))
        this.#foldedCategoryIds.delete(selectedId);
      else this.#foldedCategoryIds.add(selectedId);

      this.#renderListItems({ renderScreen: true });
    });

    this.#wrapper.key("enter", () => {
      this.#onSelect({ index: this.#cursorIndex, category: this.selected });
    });
  }

  get selected() {
    const selectedId = this.#treeLineObjects[this.#cursorIndex].id;
    return this.#categories[selectedId] || null;
  }

  moveCursor(arg: { offset: number; renderScreen: boolean }) {
    if (!this.#treeLineObjects.length) return;

    this.#cursorIndex = getCircularArrayIndex({
      offset: arg.offset,
      index: this.#cursorIndex,
      length: this.#treeLineObjects.length,
    });

    // @ts-expect-error undocumented feature
    this.#listElement.enterSelected(this.#cursorIndex);

    if (arg.renderScreen) this.#renderScreen();

    this.#onCursorMove({ index: this.#cursorIndex, category: this.selected });
  }

  get element() {
    return this.#wrapper;
  }

  #renderListItems(arg: { renderScreen: boolean }) {
    this.#treeLineObjects = getTreeLines({
      folded: this.#foldedCategoryIds,
      rootBranch: buildCategoryTree(Object.values(this.#categories)),
    });

    const treeLines = this.#treeLineObjects.map(({ line, id }, lineIndex) =>
      lineIndex ? `${line} {grey-fg}(${id}){/}` : line
    );

    this.#listElement.setItems(treeLines as any);

    // @ts-expect-error undocumented feature
    this.#listElement.enterSelected(this.#cursorIndex);

    if (arg.renderScreen) this.#renderScreen();
  }

  set categories(categories: CategoryFields[]) {
    this.#categories = categories.reduce((idToCategoryMap, category) => {
      idToCategoryMap[category.id] = Object.freeze({ ...category });
      return idToCategoryMap;
    }, {} as any);

    this.#cursorIndex = 0;

    this.#renderListItems({ renderScreen: false });
    this.#onCursorMove({ category: this.selected, index: this.#cursorIndex });

    if (this.#wrapper.parent) this.#renderScreen();
  }

  set onSelect(onSelect: OnSelect) {
    this.#onSelect = onSelect;
  }

  set onCursorMove(onCursorMove: OnSelect) {
    this.#onCursorMove = onCursorMove;
  }
}
