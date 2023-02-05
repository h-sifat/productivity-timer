import type {
  Coordinate,
  DayNameInterface,
  DateMatrixOfMonth,
} from "./interface";
import {
  MONTHS_NAMES,
  isCoordinateEqual,
  generateCalendarText,
  getDateMatrixOfMonth,
  MONTH_DATE_MATRIX_INFO,
  FormatDateNumber_Argument,
  calculateCalendarTextWidth,
  getDayNamesBasedOnStartingDay,
} from "./util";
import blessed from "blessed";
import { isSameDay } from "date-fns";
import { merge } from "common/util/merge";
import { deepFreeze } from "common/util/other";
import { formatFgAndBg, padTextToForCenterAlignment } from "tui/util";

import type {
  Debug,
  BGAndFGColor,
  BlessedKeypressHandler,
} from "tui/interface";
import type { generateCalendarText_Arg } from "./util";
import type { ReadonlyDeep, PartialDeep } from "type-fest";
import { movePointInMatrix, movePointInMatrix_Argument } from "./move-cursor";
import { createInstructionsBox } from "../instructions";

type CalendarStyle = Record<"cursor" | "current", BGAndFGColor> & {
  dayNames: Partial<BGAndFGColor>;
};

export interface Calendar_Argument {
  debug: Debug;
  year: number;
  renderScreen(): void;
  firstDayOfWeek: string;
  style?: PartialDeep<CalendarStyle>;
}

type ScrollDirection = "up" | "down" | "left" | "right";

interface getCalendarText_Arg {
  shouldFormatCursor?: boolean;
  month: { name: string; index: number };
}

function getDefaultStyles(): CalendarStyle {
  return {
    dayNames: { fg: "green" },
    cursor: { fg: "black", bg: "white" },
    current: { fg: "white", bg: "green" },
  };
}

interface Month {
  name: string;
  dateMatrix: ReadonlyDeep<DateMatrixOfMonth>;
}

interface CalendarText {
  noCursor: string;
  visitedCellsCache: { [k: string]: string };
}

const KeyBindings = Object.freeze({
  "k/up": "up",
  "j/down": "down",
  "shift-i": "input",
  "shift-(h,l)": "change year",
});

export class Calendar {
  static readonly CALENDAR_TEXT_WIDTH = calculateCalendarTextWidth();
  static readonly ELEMENT_WIDTH =
    Calendar.CALENDAR_TEXT_WIDTH +
    /* border */ 2 +
    /* scrollbar */ 1 +
    /* padding */ 2;

  readonly #debug: Debug;
  readonly #renderScreen: () => void;

  readonly #year: number;
  readonly #firstDayOfWeek: string;
  readonly #shortDayNames: readonly string[];
  readonly #dayNamesArray: ReadonlyDeep<DayNameInterface[]>;

  readonly #style: CalendarStyle;

  readonly #months: Month[];
  readonly #calendarTextOfAllMonths: CalendarText[];
  readonly #dateMatrixOfTheWholeYear: ReadonlyDeep<DateMatrixOfMonth>;

  readonly #today = new Date();
  #cursor: Coordinate = Object.seal({ x: 0, y: 0 });

  #wrapperElement = blessed.box({
    border: "line",
    width: Calendar.ELEMENT_WIDTH,
    scrollable: false,
    style: {
      focus: { border: { fg: "green" } },
    },
  });

  #todayElement = blessed.box({
    parent: this.#wrapperElement,

    top: 1,
    tags: true,
    align: "center",
    content: "hello",
  });

  #calendarElement = blessed.box({
    parent: this.#wrapperElement,
    width: "100%",
    left: -1,
    top: 2,
    bottom: 3,

    border: "line",

    keys: true,

    tags: true,
    align: "center",

    scrollable: true,
    style: {
      label: { fg: "green" },
    },
    scrollbar: {
      ch: " ",
      style: { fg: "white", bg: "grey" },
    },
  });

  #instructionElement = createInstructionsBox({
    bottom: 0,
    height: 3,
    border: false,
    align: "center",
    instructions: KeyBindings,
    parent: this.#wrapperElement,
  });

  constructor(arg: Calendar_Argument) {
    this.#debug = arg.debug;
    this.#renderScreen = arg.renderScreen;

    this.#style = merge(getDefaultStyles(), arg.style || {});

    this.#year = arg.year;
    this.#firstDayOfWeek = arg.firstDayOfWeek;

    this.#dayNamesArray = deepFreeze(
      getDayNamesBasedOnStartingDay({
        startDay: this.#firstDayOfWeek,
      })
    );
    this.#shortDayNames = Object.freeze(
      this.#dayNamesArray.map(({ name }) => name.short)
    );

    this.#months = MONTHS_NAMES.map((name, monthIndex) => {
      const month: Partial<Month> = { name };

      const dateMatrix = getDateMatrixOfMonth({
        monthIndex,
        year: this.#year,
        dayNamesArray: this.#dayNamesArray,
      });

      month.dateMatrix = deepFreeze(dateMatrix);
      return month as Month;
    });

    this.#calendarTextOfAllMonths = this.#months.map(({ name }, index) => {
      const calendarText: Partial<CalendarText> = {
        visitedCellsCache: {},
      };

      calendarText.noCursor = this.#getCalendarText({
        month: { name, index },
        shouldFormatCursor: false,
      });

      return calendarText as CalendarText;
    });

    this.#dateMatrixOfTheWholeYear = this.#months
      .map(({ dateMatrix }) => dateMatrix)
      .reduce(
        (yearMatrix, monthDateMatrix) => yearMatrix.concat(monthDateMatrix),
        [] as DateMatrixOfMonth
      );

    this.#addWrapperEventHandlers();
    this.#addKeyPressEventListeners();
    // draw the initial calendar
    this.#moveCursor({ scrollDirection: "right", step: 0 });
  }

  #addWrapperEventHandlers() {
    this.#wrapperElement.on("focus", () => {
      this.#calendarElement.style.border = { fg: "green" };
      // this.#calendarElement.style.label = { fg: "green" };
      this.#renderScreen();
    });

    this.#wrapperElement.on("blur", () => {
      this.#calendarElement.style.border = { fg: "white" };
      this.#wrapperElement.style.border = { fg: "white" };
      // this.#calendarElement.style.label = { fg: "green" };
      this.#renderScreen();
    });
  }

  #addKeyPressEventListeners() {
    const keyPressHandler: BlessedKeypressHandler = (_, key) => {
      if (!("name" in key)) return;

      const rowIncrementOnShift = MONTH_DATE_MATRIX_INFO.NUM_OF_ROWS_IN_MONTH;

      let scrollDirection: ScrollDirection | undefined;
      let step: number = 1;

      switch (key.name) {
        case "j":
        case "down":
          if (key.shift) step = rowIncrementOnShift;
          scrollDirection = "down";
          break;

        case "k":
        case "up":
          if (key.shift) step = rowIncrementOnShift;
          scrollDirection = "up";
          break;

        case "l":
        case "right":
          scrollDirection = "right";
          break;

        case "h":
        case "left":
          scrollDirection = "left";
          break;
      }

      if (scrollDirection && step) {
        this.#moveCursor({ step, scrollDirection });
        return false;
      }
      return true;
    };

    this.#wrapperElement.on("keypress", keyPressHandler);
  }

  #moveCursor(arg: { step: number; scrollDirection: ScrollDirection }) {
    // calculate new cursor position
    {
      const commonMovePointInMatrixArg: Omit<
        movePointInMatrix_Argument,
        "step" | "point"
      > = {
        direction: arg.scrollDirection,
        numOfRows: this.#dateMatrixOfTheWholeYear.length,
        numOfColumns: MONTH_DATE_MATRIX_INFO.NUM_OF_DAYS_IN_ROW,
      };

      let { step } = arg;
      let date: Date | null | undefined;
      let currentCursor = { ...this.#cursor };

      // This loop skips all empty cells
      while (!date) {
        currentCursor = movePointInMatrix({
          step,
          point: currentCursor,
          ...commonMovePointInMatrixArg,
        });

        date = this.#getDateAtCursor(currentCursor);

        // if step was something other than 1
        // (e.g., initially 0, or when shift is pressed) then reset it now
        step = 1;
      }

      this.#cursor.x = currentCursor.x;
      this.#cursor.y = currentCursor.y;
    }

    // Update content
    this.#calendarElement.setContent(this.#joinAllMonthsCalendarText());
    this.#calendarElement.setLabel({ text: `[${this.#year}]`, side: "right" });
    this.#todayElement.setContent(
      `Today: {green-fg}${this.#today.toDateString()}{/}`
    );

    // I'm using step 0 to draw the first calendar. But at this point as the
    // element hasn't rendered yet, setting the scroll position throws
    // an error.
    if (arg.step !== 0)
      this.#updateScrollPosition({
        renderScreen: false,
        direction: arg.scrollDirection,
      });

    this.#renderScreen();
  }

  #updateScrollPosition(arg: {
    renderScreen?: boolean;
    direction: ScrollDirection;
  }) {
    const monthNumber = this.#yearMatrixCursorToMonthIndex(this.#cursor) + 1;

    if (monthNumber === 1) this.#calendarElement.setScrollPerc(0);
    else if (monthNumber === 12) this.#calendarElement.setScrollPerc(100);
    else {
      // monthNumber * 2 = Every previous month's Month name + Day names rows
      const cursorRowNumber = this.#cursor.y + monthNumber * 2;
      const numOfMonthAndDayNamesRowsInWholeYear = 12 * 2;

      const totalRows =
        this.#dateMatrixOfTheWholeYear.length +
        numOfMonthAndDayNamesRowsInWholeYear;

      let scrollPercentage = (cursorRowNumber / totalRows) * 100;

      // adding a arbitrary offset so that the cursor doesn't
      // touch the edge of the box
      if (arg.direction === "up") scrollPercentage -= 5;
      if (arg.direction === "down") scrollPercentage += 5;

      this.#calendarElement.setScrollPerc(scrollPercentage);
    }

    if (arg.renderScreen) this.#renderScreen();
  }

  #getCalendarText(arg: getCalendarText_Arg) {
    const { month, shouldFormatCursor } = arg;

    return generateCalendarText({
      month,
      dayNames: this.#shortDayNames,
      formatMonthName: this.#formatMonthName,
      dateMatrix: this.#months[month.index].dateMatrix,
      formatJoinedDayNames: this.#formatJoinedDayNames,
      formatDateNumber: (formatterArg) =>
        this.#formatDateNumber({ ...formatterArg, shouldFormatCursor }),
    });
  }

  #formatDateNumber = (
    arg: FormatDateNumber_Argument & {
      shouldFormatCursor?: boolean | undefined;
    }
  ) => {
    const {
      cursor,
      formattedDateNumber,
      shouldFormatCursor = true,
      dateObject: formattingDate,
    } = arg;

    // cursor style
    if (shouldFormatCursor && isCoordinateEqual(this.#cursor, cursor))
      return formatFgAndBg({
        style: this.#style.cursor,
        value: formattedDateNumber,
      });

    // current date style
    if (formattingDate && isSameDay(this.#today, formattingDate)) {
      const styled = formatFgAndBg({
        style: this.#style.current,
        value: formattedDateNumber,
      });
      return `{bold}${styled}{/bold}`;
    }

    // normal
    return formattedDateNumber;
  };

  #formatMonthName: Required<generateCalendarText_Arg>["formatMonthName"] = (
    text
  ) =>
    padTextToForCenterAlignment({
      text,
      heavierSide: "right",
      width: Calendar.CALENDAR_TEXT_WIDTH,
    });

  #formatJoinedDayNames: Required<generateCalendarText_Arg>["formatJoinedDayNames"] =
    (names) => formatFgAndBg({ style: this.#style.dayNames, value: names });

  #cursorToKey({ x, y }: Coordinate) {
    return `${x}:${y}`;
  }

  #joinAllMonthsCalendarText() {
    const cursorKey = this.#cursorToKey(this.#cursor);
    const monthIndexOfCursor = this.#yearMatrixCursorToMonthIndex(this.#cursor);

    return this.#calendarTextOfAllMonths
      .map(({ noCursor, visitedCellsCache }, currentMonthIndex) => {
        if (monthIndexOfCursor !== currentMonthIndex) return noCursor;

        if (!visitedCellsCache[cursorKey])
          visitedCellsCache[cursorKey] = this.#getCalendarText({
            shouldFormatCursor: true,
            month: {
              index: currentMonthIndex,
              name: this.#months[currentMonthIndex].name,
            },
          });

        return visitedCellsCache[cursorKey];
      })
      .join("\n");
  }

  #yearMatrixCursorToMonthIndex(cursor: Coordinate) {
    return Math.floor(cursor.y / MONTH_DATE_MATRIX_INFO.NUM_OF_ROWS_IN_MONTH);
  }

  #getDateAtCursor({ x, y }: Coordinate) {
    return this.#dateMatrixOfTheWholeYear[y][x];
  }

  get element() {
    return this.#wrapperElement;
  }
}
