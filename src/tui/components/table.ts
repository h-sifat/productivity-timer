import {
  pick,
  cloneDeep,
  deepFreeze,
  getCircularArrayIndex,
} from "common/util/other";
import blessed from "blessed";
import { merge } from "common/util/merge";
import { assert, handyTypes } from "handy-types";
import { createInstructionsBox } from "./instructions";

import type {
  Debug,
  ElementPosition,
  ElementDimension,
  BlessedElementStyle,
} from "tui/interface";
import type { Widgets } from "blessed";
import type { ReadonlyDeep, Writable } from "type-fest";

export type TableColumn = { name: string; label: string };

export interface Table_Argument<T extends object> {
  position?: ElementPosition;
  dimension?: ElementDimension;
  tableStyle?: BlessedElementStyle;
  columns: (string | TableColumn)[];
  formatObject?: (o: Writable<T>) => any;

  additionalInstructions?: object;

  debug: Debug;
  renderScreen(): void;
}

export type OnProjectSubmit<T> = (arg: {
  index: number;
  object: ReadonlyDeep<T> | null;
}) => void;

function getDefaultStyles() {
  return {
    header: { fg: "white", bg: "black" },
    cell: {
      fg: "green",
      selected: { fg: "white", bg: "green" },
    },
  };
}

export class Table<T extends object> {
  readonly #wrapper: Widgets.BoxElement;
  readonly #listtable: Widgets.ListTableElement;

  readonly #formatObject: (o: Writable<T>) => any;

  #cursorIndex = 0;
  readonly #columns: readonly Readonly<TableColumn>[];
  #rowObjects: readonly ReadonlyDeep<T>[] = [];

  readonly #debug: Debug;
  readonly #renderScreen: () => void;

  #onSubmit: OnProjectSubmit<T> = () => {};
  #onCursorMove: OnProjectSubmit<T> = () => {};

  constructor(arg: Table_Argument<T>) {
    this.#debug = arg.debug;
    this.#renderScreen = arg.renderScreen;
    this.#columns = Object.freeze(
      arg.columns
        .map((column) =>
          typeof column === "string"
            ? { name: column, label: column }
            : { ...column }
        )
        .map((o) => Object.freeze(o))
    );
    this.#formatObject = arg.formatObject || ((o) => o);

    const { position = {}, dimension = {}, tableStyle = {} } = arg;

    this.#wrapper = blessed.box({
      ...pick(dimension, ["width", "height"]),
      ...pick(position, ["top", "bottom", "left", "right"]),

      style: { border: { fg: "white" }, focus: { border: { fg: "green" } } },

      keys: true,
      mouse: false,
      border: "line",
      scrollable: true,
    });

    this.#listtable = blessed.listtable({
      parent: this.#wrapper,

      top: 0,
      bottom: 1,
      width: "100%-2",

      tags: true,

      keys: false,
      mouse: false,
      scrollable: true,
      style: merge(getDefaultStyles(), tableStyle),

      scrollbar: { ch: " ", style: { bg: "white" }, track: { bg: "black" } },
    });

    {
      const { additionalInstructions = {} } = arg;
      createInstructionsBox({
        bottom: 0,
        height: 1,
        border: false,
        parent: this.#wrapper,
        align: "center",
        instructions: {
          ...additionalInstructions,
          "k/up": "up",
          enter: "select",
          "j/down": "down",
        },
      });
    }

    this.#listtable.once("render", () => {
      this.#listtable.parent.on("resize", () => {
        this.#listtable.width = "100%-2";
      });
    });

    // -------------------- Event Handling ------------------
    this.#wrapper.key(["j", "down"], () => {
      this.#cursorIndex = getCircularArrayIndex({
        offset: 1,
        index: this.#cursorIndex,
        length: this.#rowObjects.length,
      });
      this.#renderCursor({ renderScreen: true });
      this.#callOnCursorMove();
    });

    this.#wrapper.key(["k", "up"], () => {
      this.#cursorIndex = getCircularArrayIndex({
        offset: -1,
        index: this.#cursorIndex,
        length: this.#rowObjects.length,
      });
      this.#renderCursor({ renderScreen: true });
      this.#callOnCursorMove();
    });

    this.#wrapper.key("enter", () => {
      this.#onSubmit({ object: this.selected, index: this.#cursorIndex });
    });

    // for some unknown reason the border color is not working
    this.#wrapper.on("blur", () => {
      this.#wrapper.style = { border: { fg: "white" } };
    });
  }

  #callOnCursorMove() {
    this.#onCursorMove({ object: this.selected, index: this.#cursorIndex });
  }

  #renderCursor(arg: { renderScreen?: boolean } = {}) {
    // +1 for the header row
    this.#listtable.select(this.#cursorIndex + 1);
    if (this.#cursorIndex === 0) this.#listtable.setScrollPerc(0);

    if (arg.renderScreen) this.#renderScreen();
  }

  updateRows(arg: { rowObjects: T[]; cursorIndex?: number }) {
    this.#rowObjects = deepFreeze(cloneDeep(arg.rowObjects)) as any;
    this.#listtable.setData(this.#getTableRows());

    if (arg.cursorIndex) {
      assert<number>("positive_integer", arg.cursorIndex, {
        name: "cursorIndex",
      });
      this.#cursorIndex = arg.cursorIndex;
    }

    this.#renderCursor({ renderScreen: false });
    this.#renderScreen();
    this.#callOnCursorMove();
  }

  #getTableRows(): string[][] {
    return [
      this.#columns.map(({ label }) => label),
      ...convertObjectsToTableRows({
        columns: this.#columns,
        objects: this.#rowObjects,
        formatObject: this.#formatObject,
      }),
    ];
  }

  get element() {
    return this.#wrapper;
  }

  get selected() {
    return this.#rowObjects[this.#cursorIndex] || null;
  }

  get list() {
    return this.#listtable;
  }

  set onSubmit(onSubmit: OnProjectSubmit<T>) {
    this.#onSubmit = onSubmit;
  }

  set onCursorMove(onCursorMove: OnProjectSubmit<T>) {
    this.#onCursorMove = onCursorMove;
  }
}

export interface convertObjectsToRows_Argument {
  formatObject?: (o: any) => any;
  objects: any[] | readonly any[];
  columns: readonly Readonly<TableColumn>[];
}
export function convertObjectsToTableRows(arg: convertObjectsToRows_Argument) {
  const { columns, formatObject = (o) => o, objects } = arg;

  return objects
    .map((o) => formatObject(cloneDeep(o)))
    .map((object) =>
      columns.map(({ name: columnName }) =>
        handyTypes.non_nullish(object[columnName])
          ? String(object[columnName])
          : "-"
      )
    );
}
