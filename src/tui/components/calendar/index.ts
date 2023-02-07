import type {
  DateRange,
  Coordinate,
  CalendarStyle,
  CalendarElements,
  DayNameInterface,
  DateMatrixOfMonth,
} from "./interface";

import type {
  Debug,
  TextStyle,
  ElementPosition,
  ElementDimension,
  BlessedKeypressHandler,
} from "tui/interface";

import {
  MONTHS_NAMES,
  isCoordinateEqual,
  generateCalendarText,
  getDateMatrixOfMonth,
  MONTH_DATE_MATRIX_INFO,
  generateCalendarText_Arg,
  FormatDateNumber_Argument,
  calculateCalendarTextWidth,
  getDayNamesBasedOnStartingDay,
} from "./util";

import {
  DateRangeSchema,
  isDateWithinRange,
  isYearWithinRange,
} from "./util/date-time";

import {
  formatFgAndBg,
  setElementsLabelStyle,
  formatTextForBlessedElement,
  padTextToForCenterAlignment,
} from "tui/util";

import {
  movePointInMatrix,
  movePointInMatrix_Argument,
} from "./util/move-cursor";
import { makeCalendarElements } from "./util/make-elements";
import { mergeWithDefaultCalendarStyles } from "./util/style";

import { assert } from "handy-types";
import { isSameDay } from "date-fns";
import { deepFreeze } from "common/util/other";
import type { ReadonlyDeep, PartialDeep } from "type-fest";

// ------------------- Types and Interfaces -----------------
export interface Calendar_Argument {
  debug: Debug;
  year: number;
  renderScreen(): void;
  firstDayOfWeek: string;
  position?: ElementPosition;
  additionalKeyBindings?: object;
  allowedRange?: Partial<DateRange>;
  style?: PartialDeep<CalendarStyle>;
  customDateFormatter?: CustomDateFormatter;
  dimension?: Pick<ElementDimension, "height">;
}

type ScrollDirection = "up" | "down" | "left" | "right";

interface getCalendarText_Arg {
  shouldFormatCursor?: boolean;
  month: {
    name: string;
    index: number;
    dateMatrix: ReadonlyDeep<DateMatrixOfMonth>;
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

interface YearCalendarState {
  months: Readonly<Month>[];
  renderedTextOfMonths: CalendarText[];
  yearDateMatrix: ReadonlyDeep<DateMatrixOfMonth>;
}

type CustomDateFormatter = (
  arg: FormatDateNumber_Argument
) => Partial<TextStyle> | undefined;

type OnCursorMove_Argument = { date: Date; cursor: Coordinate };
export type OnCursorMove = (arg: OnCursorMove_Argument) => void;
export type ShouldCursorMove = (arg: OnCursorMove_Argument) => boolean;

// ------------ Global Constants -------------------
const KeyBindings = Object.freeze({
  "k/up": "up",
  enter: "select",
  "h/left": "left",
  "j/down": "down",
  "l/right": "right",
  "S-(h,l)": "change year",
});

const NUM_OF_ROWS_IN_YEAR_DATE_MATRIX =
  MONTH_DATE_MATRIX_INFO.NUM_OF_ROWS_IN_MONTH * 12;
// ------------ End Global Constants -------------------

export class Calendar {
  static readonly CALENDAR_TEXT_WIDTH = calculateCalendarTextWidth();
  static readonly ELEMENT_WIDTH =
    Calendar.CALENDAR_TEXT_WIDTH +
    /* border */ 2 +
    /* scrollbar */ 1 +
    /* padding */ 2;

  readonly #debug: Debug;
  readonly #renderScreen: () => void;

  // ---- States --------------
  #today = new Date();
  #currentYear: number;

  #isCursorHidden = false;
  readonly #cursor: Coordinate = Object.seal({ x: 0, y: 0 });

  readonly #state: { [year: string]: YearCalendarState } = {};
  // ---- End States --------------

  readonly #style: CalendarStyle;
  readonly #elements: CalendarElements;
  readonly #shortDayNames: readonly string[];
  readonly #allowedRange: Readonly<Partial<DateRange>>;
  readonly #dayNamesArray: ReadonlyDeep<DayNameInterface[]>;

  // ------- Other ---------------
  #onSelect: OnCursorMove = () => {};
  #onCursorMove: OnCursorMove = () => {};
  #customDateFormatter: CustomDateFormatter;
  #shouldCursorMove: ShouldCursorMove = () => true;

  constructor(arg: Calendar_Argument) {
    this.#debug = arg.debug;
    this.#renderScreen = arg.renderScreen;

    this.#customDateFormatter = arg.customDateFormatter || (() => undefined);

    {
      const { additionalKeyBindings = {} } = arg;
      this.#elements = makeCalendarElements({
        position: arg.position || {},
        instructions: { ...KeyBindings, ...additionalKeyBindings },
        dimension: { ...arg.dimension, width: Calendar.ELEMENT_WIDTH },
      });
    }

    {
      const range = DateRangeSchema.parse(arg.allowedRange || {});
      this.#allowedRange = Object.freeze(range);
    }

    this.#style = mergeWithDefaultCalendarStyles(arg.style);

    this.#dayNamesArray = deepFreeze(
      getDayNamesBasedOnStartingDay({ startDay: arg.firstDayOfWeek })
    );
    this.#shortDayNames = Object.freeze(
      this.#dayNamesArray.map(({ name }) => name.short)
    );

    assert<number>("non_negative_integer", arg.year, { name: "year" });
    this.#currentYear = arg.year;
    this.#state[arg.year] = this.#initYearCalendarState({ year: arg.year });

    this.#addWrapperEventHandlers();

    // draw the initial calendar
    if (this.#isCursorHidden) this.#updateCalenderContent();
    else this.#moveCursor({ scrollDirection: "right", step: 0 });
  }

  #addWrapperEventHandlers() {
    this.#elements.wrapper.on("focus", () => {
      this.#elements.calendar.style.border = { fg: "green" };
      setElementsLabelStyle({
        style: { fg: "green" },
        element: this.#elements.calendar,
      });
      this.#renderScreen();
    });

    this.#elements.wrapper.on("blur", () => {
      this.#elements.calendar.style.border = { fg: "white" };
      this.#elements.wrapper.style.border = { fg: "white" };
      setElementsLabelStyle({
        style: { fg: "white" },
        element: this.#elements.calendar,
      });

      this.#renderScreen();
    });

    this.#addKeyPressEventListeners();
  }

  #addKeyPressEventListeners() {
    const keyPressHandler: BlessedKeypressHandler = (_, key) => {
      if (!("name" in key)) return true;

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
          if (key.shift) this.#changeYear({ newYear: this.#currentYear + 1 });
          else scrollDirection = "right";
          break;

        case "h":
        case "left":
          if (key.shift) this.#changeYear({ newYear: this.#currentYear - 1 });
          else scrollDirection = "left";
          break;
      }

      if (scrollDirection && step) {
        this.#moveCursor({ step, scrollDirection });
        return false;
      }
      return true;
    };

    this.#elements.wrapper.on("keypress", keyPressHandler);
    this.#elements.wrapper.key("enter", () => {
      this.#onSelect({ cursor: this.#cursor, date: this.dateAtCursor });
    });
  }

  #initYearCalendarState(arg: { year: number }): YearCalendarState {
    const { year } = arg;

    const months: YearCalendarState["months"] = MONTHS_NAMES.map(
      (name, monthIndex) => {
        const month: Partial<Month> = { name };

        const dateMatrix = getDateMatrixOfMonth({
          year,
          monthIndex,
          dayNamesArray: this.#dayNamesArray,
        });

        month.dateMatrix = deepFreeze(dateMatrix);
        return month as Month;
      }
    );

    const renderedTextOfMonths: YearCalendarState["renderedTextOfMonths"] =
      months.map(({ name, dateMatrix }, index) => {
        const noCursor = this.#getCalendarText({
          month: { name, index, dateMatrix },
          shouldFormatCursor: false,
        });

        return { noCursor, visitedCellsCache: {} };
      });

    const yearDateMatrix = months
      .map(({ dateMatrix }) => dateMatrix)
      .reduce(
        (yearMatrix, monthDateMatrix) => yearMatrix.concat(monthDateMatrix),
        [] as DateMatrixOfMonth
      );

    return { months, renderedTextOfMonths, yearDateMatrix };
  }

  #changeYear(arg: { newYear: number }) {
    const { newYear } = arg;

    if (!isYearWithinRange(newYear, this.#allowedRange))
      // @TODO show error message
      return;

    if (!this.#state[newYear])
      this.#state[newYear] = this.#initYearCalendarState({ year: newYear });

    this.#currentYear = newYear;
    this.#updateCalenderContent({ renderScreen: true });
  }

  #moveCursor(arg: { step: number; scrollDirection: ScrollDirection }) {
    if (this.#isCursorHidden) return;

    // calculate new cursor position
    {
      const yearDateMatrix = this.#state[this.#currentYear].yearDateMatrix;

      const commonMovePointInMatrixArg: Omit<
        movePointInMatrix_Argument,
        "step" | "point"
      > = {
        direction: arg.scrollDirection,
        numOfRows: NUM_OF_ROWS_IN_YEAR_DATE_MATRIX,
        numOfColumns: MONTH_DATE_MATRIX_INFO.NUM_OF_DAYS_IN_ROW,
      };

      let { step } = arg;
      let date: Date | null | undefined;
      let currentCursor = { ...this.#cursor };

      // This loop skips all empty cells and disabled dates
      while (!date || !isDateWithinRange(date, this.#allowedRange)) {
        currentCursor = movePointInMatrix({
          step,
          point: currentCursor,
          ...commonMovePointInMatrixArg,
        });

        date = this.#getDateAtCursor({
          cursor: currentCursor,
          yearDateMatrix,
        });

        // if step was something other than 1
        // (e.g., initially 0, or when shift is pressed) then reset it now
        step = 1;
      }

      if (!this.#shouldCursorMove({ date, cursor: currentCursor })) return;

      this.#cursor.x = currentCursor.x;
      this.#cursor.y = currentCursor.y;
    }

    // Update content
    this.#updateCalenderContent({ renderScreen: false });

    // I'm using step 0 to render the first cursor. But at this point as the
    // element hasn't rendered yet, setting the scroll position throws
    // an error.
    if (arg.step !== 0)
      this.#updateScrollPosition({
        renderScreen: false,
        direction: arg.scrollDirection,
      });

    this.#renderScreen();

    this.#onCursorMove({ cursor: this.#cursor, date: this.dateAtCursor });
  }

  #updateCalenderContent(arg: { renderScreen?: boolean } = {}) {
    this.#elements.calendar.setContent(
      this.#joinAllMonthsCalendarText({
        calendarState: this.#state[this.#currentYear],
      })
    );
    this.#elements.calendar.setLabel({
      text: `[${this.#currentYear}]`,
      side: "right",
    });
    this.#elements.todayText.setContent(
      `Today: {green-fg}${this.#today.toDateString()}{/}`
    );

    const { renderScreen = true } = arg;
    if (renderScreen) this.#renderScreen();
  }

  #updateScrollPosition(arg: {
    renderScreen?: boolean;
    direction: ScrollDirection;
  }) {
    if (this.#isCursorHidden) return;
    const monthNumber = this.#yearMatrixCursorToMonthIndex(this.#cursor) + 1;

    if (monthNumber === 1) this.#elements.calendar.setScrollPerc(0);
    else if (monthNumber === 12) this.#elements.calendar.setScrollPerc(100);
    else {
      // monthNumber * 2 = Every previous month's Month name + Day names rows
      const cursorRowNumber = this.#cursor.y + monthNumber * 2;
      const numOfMonthAndDayNamesRowsInWholeYear = 12 * 2;

      const totalRows =
        NUM_OF_ROWS_IN_YEAR_DATE_MATRIX + numOfMonthAndDayNamesRowsInWholeYear;

      let scrollPercentage = (cursorRowNumber / totalRows) * 100;

      // adding a arbitrary offset so that the cursor doesn't
      // touch the edge of the box
      if (arg.direction === "up") scrollPercentage -= 5;
      if (arg.direction === "down") scrollPercentage += 5;

      this.#elements.calendar.setScrollPerc(scrollPercentage);
    }

    const { renderScreen = true } = arg;
    if (renderScreen) this.#renderScreen();
  }

  #getCalendarText(arg: getCalendarText_Arg) {
    const { month, shouldFormatCursor } = arg;

    return generateCalendarText({
      month,
      dateMatrix: month.dateMatrix,
      dayNames: this.#shortDayNames,
      formatMonthName: this.#formatMonthName,
      formatJoinedDayNames: this.#formatJoinedDayNames,
      formatDateNumber: (formatterArg) =>
        this.#formatDateNumber({ ...formatterArg, shouldFormatCursor }),
    });
  }

  // ----------------- Formatters -------------------------
  #formatDateNumber = (
    arg: FormatDateNumber_Argument & {
      shouldFormatCursor?: boolean | undefined;
    }
  ) => {
    const {
      cursor: currentDateCoordinate,
      formattedDateNumber,
      shouldFormatCursor = true,
      dateObject: formattingDate,
    } = arg;

    if (
      formattingDate &&
      !isDateWithinRange(formattingDate, this.#allowedRange)
    ) {
      return `{grey-fg}${formattedDateNumber}{/grey-fg}`;
    }

    let style: Partial<TextStyle> | undefined;

    // cursor style
    if (
      shouldFormatCursor &&
      isCoordinateEqual(this.#cursor, currentDateCoordinate)
    )
      style = this.#style.cursor;
    // current date style
    else if (formattingDate && isSameDay(this.#today, formattingDate))
      style = this.#style.today;
    else style = this.#customDateFormatter(arg);

    return style
      ? formatTextForBlessedElement({ style, text: formattedDateNumber })
      : formattedDateNumber;
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
    (names) => formatFgAndBg({ style: this.#style.dayName, value: names });

  #cursorToKey({ x, y }: Coordinate) {
    return `${x}:${y}`;
  }
  // ----------------- End Formatters -------------------------

  #joinAllMonthsCalendarText(arg: { calendarState: YearCalendarState }) {
    const { calendarState } = arg;

    return calendarState.renderedTextOfMonths
      .map(({ noCursor, visitedCellsCache }, currentMonthIndex) => {
        if (
          this.#isCursorHidden ||
          this.#yearMatrixCursorToMonthIndex(this.#cursor) !== currentMonthIndex
        )
          return noCursor;

        const cursorKey = this.#cursorToKey(this.#cursor);
        if (!visitedCellsCache[cursorKey])
          visitedCellsCache[cursorKey] = this.#getCalendarText({
            shouldFormatCursor: true,
            month: {
              index: currentMonthIndex,
              name: calendarState.months[currentMonthIndex].name,
              dateMatrix: calendarState.months[currentMonthIndex].dateMatrix,
            },
          });

        return visitedCellsCache[cursorKey];
      })
      .join("\n");
  }

  // -------------------- Utils --------------------

  #yearMatrixCursorToMonthIndex(cursor: Coordinate) {
    return Math.floor(cursor.y / MONTH_DATE_MATRIX_INFO.NUM_OF_ROWS_IN_MONTH);
  }

  #getDateAtCursor(arg: {
    cursor: Coordinate;
    yearDateMatrix: YearCalendarState["yearDateMatrix"];
  }) {
    const { cursor, yearDateMatrix } = arg;
    return yearDateMatrix[cursor.y][cursor.x];
  }

  // ----- Getters -------------
  get dateAtCursor(): Date {
    return this.#getDateAtCursor({
      cursor: this.#cursor,
      yearDateMatrix: this.#state[this.#currentYear].yearDateMatrix,
    })!;
  }

  get element() {
    return this.#elements.wrapper;
  }

  // ------- Setters -----------
  set customDateFormatter(func: CustomDateFormatter) {
    this.#customDateFormatter = func;
  }

  set onCursorMove(f: OnCursorMove) {
    this.#onCursorMove = f;
  }

  set shouldCursorMove(f: ShouldCursorMove) {
    this.#shouldCursorMove = f;
  }

  set onSelect(f: OnCursorMove) {
    this.#onSelect = f;
  }
}
