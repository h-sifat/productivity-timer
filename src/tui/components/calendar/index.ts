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
  TimerManagerInterface,
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
import { endOfDay, isSameDay } from "date-fns";
import { deepFreeze } from "common/util/other";
import type { ReadonlyDeep, PartialDeep } from "type-fest";

// ------------------- Types and Interfaces -----------------
export interface Calendar_Argument {
  debug: Debug;
  renderScreen(): void;
  position?: ElementPosition;
  additionalKeyBindings?: object;
  style?: PartialDeep<CalendarStyle>;
  timerManager: TimerManagerInterface;
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

type OnCursorMove_Argument = { date: Date | null; cursor: Coordinate };
export type OnCursorMove = (arg: OnCursorMove_Argument) => void;
export type ShouldCursorMove = (arg: OnCursorMove_Argument) => boolean;

// ------------ Global Constants -------------------
const KeyBindings = Object.freeze({
  "k/up": "up",
  enter: "select",
  "h/left": "left",
  "j/down": "down",
  "l/right": "right",
  "shift-[h,l]": "change year",
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
  #currentYear: number | null = null;

  #isCursorHidden = false;
  readonly #cursor: Coordinate = Object.seal({ x: 0, y: 0 });

  readonly #state: { [year: string]: YearCalendarState } = {};
  // ---- End States --------------

  readonly #style: CalendarStyle;
  readonly #elements: CalendarElements;
  #allowedRange: Readonly<Partial<DateRange>> = {};

  #shortDayNames: readonly string[] | null = null;
  #dayNamesArray: ReadonlyDeep<DayNameInterface[]> | null = null;

  // ------- Other ---------------
  #onSelect: OnCursorMove = () => {};
  #onCursorMove: OnCursorMove = () => {};
  #shouldCursorMove: ShouldCursorMove = () => true;
  #customDateFormatter: CustomDateFormatter = () => undefined;

  constructor(arg: Calendar_Argument) {
    this.#debug = arg.debug;
    this.#renderScreen = arg.renderScreen;

    {
      const { additionalKeyBindings = {} } = arg;
      this.#elements = makeCalendarElements({
        position: arg.position || {},
        instructions: { ...KeyBindings, ...additionalKeyBindings },
        dimension: { ...arg.dimension, width: Calendar.ELEMENT_WIDTH },
      });
    }

    this.#style = mergeWithDefaultCalendarStyles(arg.style);

    this.#addWrapperEventHandlers();

    // Setting up current date updater
    {
      let timerId: any;
      const currentDateUpdater = () => {
        const newDate = new Date();

        if (isSameDay(newDate, this.#today)) {
          arg.timerManager.clearTimeout(timerId);
        } else {
          this.#today = newDate;
          const year = this.#today.getFullYear();

          if (isYearWithinRange(year, this.#allowedRange)) {
            // clear the cache
            this.#state[year] = this.#initYearCalendarState({ year });
          }

          this.#renderCalenderContent({ renderScreen: true });
        }

        const msLeftBeforeNextDay =
          endOfDay(this.#today).getTime() - newDate.getTime();

        timerId = arg.timerManager.setTimeout(
          currentDateUpdater,
          msLeftBeforeNextDay + /* arbitrary offset */ 2000
        );
      };

      currentDateUpdater();
    }

    this.#setFirstDayOfWeek({ dayName: "Sat", updateCalendarContent: false });
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
      if (!("name" in key) || key.ctrl) return true;

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
          if (key.shift && this.#currentYear)
            this.#changeYear({ newYear: this.#currentYear + 1 });
          else scrollDirection = "right";
          break;

        case "h":
        case "left":
          if (key.shift && this.#currentYear)
            this.#changeYear({ newYear: this.#currentYear - 1 });
          else scrollDirection = "left";
          break;
      }

      if (scrollDirection && step) {
        this.#moveCursor({ step, direction: scrollDirection });
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
    if (!this.#dayNamesArray)
      throw new Error(`The day names array is not initialized.`);

    const { year } = arg;

    const months: YearCalendarState["months"] = MONTHS_NAMES.map(
      (name, monthIndex) => {
        const month: Partial<Month> = { name };

        const dateMatrix = getDateMatrixOfMonth({
          year,
          monthIndex,
          dayNamesArray: this.#dayNamesArray!,
        });

        month.dateMatrix = deepFreeze(dateMatrix);
        return month as Month;
      }
    );

    const renderedTextOfMonths: YearCalendarState["renderedTextOfMonths"] =
      months.map(({ name, dateMatrix }, index) => {
        const noCursor = this.#getCalendarText({
          shouldFormatCursor: false,
          month: { name, index, dateMatrix },
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
    this.#renderCalenderContent({ renderScreen: true });
  }

  #moveCursor(arg: { step: number; direction: ScrollDirection }) {
    if (this.#isCursorHidden || !this.#currentYear) return;

    // calculate new cursor position
    {
      const yearDateMatrix = this.#state[this.#currentYear].yearDateMatrix;

      const commonMovePointInMatrixArg: Omit<
        movePointInMatrix_Argument,
        "step" | "point"
      > = {
        direction: arg.direction,
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

        date = this.#getDateAtCursor({ cursor: currentCursor, yearDateMatrix });

        // if step was something other than 1
        // (e.g., initially 0, or when shift is pressed) then reset it now
        step = 1;
      }

      if (!this.#shouldCursorMove({ date, cursor: currentCursor })) return;

      this.#cursor.x = currentCursor.x;
      this.#cursor.y = currentCursor.y;
    }

    // Update content
    this.#renderCalenderContent({ renderScreen: false });

    // I'm using step 0 to render the first cursor. But at this point as the
    // element hasn't rendered yet, setting the scroll position throws
    // an error.
    if (arg.step !== 0)
      this.#updateScrollPosition({
        renderScreen: false,
        direction: arg.direction,
      });

    this.#renderScreen();

    this.#onCursorMove({ cursor: this.#cursor, date: this.dateAtCursor });
  }

  #renderCalenderContent(arg: { renderScreen?: boolean } = {}) {
    if (this.#currentYear) {
      this.#elements.calendar.setContent(
        this.#joinAllMonthsCalendarText({
          calendarState: this.#state[this.#currentYear],
        })
      );
      this.#elements.calendar.setLabel({
        text: `[${this.#currentYear}]`,
        side: "right",
      });
    }

    this.#elements.todayText.setContent(
      `Today: {green-fg}${this.#today.toDateString()}{/}`
    );

    if (arg.renderScreen || true) this.#renderScreen();
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
      // monthNumber * 2 = previous months' name + day names rows
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
    if (!this.#shortDayNames)
      throw new Error(`The dayNames is not initialized.`);

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
      formattedDateNumber,
      shouldFormatCursor = true,
      dateObject: formattingDate,
      cursor: currentDateCoordinate,
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

  // ------------ Updater Methods -------------------
  setCurrentYear(arg: { year: number; range?: Partial<DateRange> }) {
    const range = DateRangeSchema.parse(arg.range || {});
    this.#allowedRange = Object.freeze(range);

    assert<number>("non_negative_integer", arg.year, { name: "year" });
    this.#currentYear = arg.year;

    for (const key in this.#state) delete this.#state[key];

    this.#state[this.#currentYear] = this.#initYearCalendarState({
      year: this.#currentYear,
    });

    this.#renderCalenderContent({ renderScreen: true });
    this.#moveCursorToInitialPosition();
  }

  #setFirstDayOfWeek(arg: {
    dayName: string;
    updateCalendarContent?: boolean;
  }) {
    this.#dayNamesArray = deepFreeze(
      getDayNamesBasedOnStartingDay({ firstDay: arg.dayName })
    );
    this.#shortDayNames = Object.freeze(
      this.#dayNamesArray.map(({ name }) => name.short)
    );

    // now we need to change all the rendered calendar texts
    Object.keys(this.#state).forEach((year) => {
      this.#state[year] = this.#initYearCalendarState({ year: +year });
    });

    if (arg.updateCalendarContent || true)
      this.#renderCalenderContent({ renderScreen: true });

    if (!this.dateAtCursor) this.#moveCursorToInitialPosition();
  }

  setFirstDayOfWeek(dayName: string) {
    this.#setFirstDayOfWeek({ dayName, updateCalendarContent: true });
  }

  #moveCursorToInitialPosition() {
    this.#moveCursor({ direction: "right", step: 0 });
  }

  hideCursor() {
    this.#isCursorHidden = true;
  }

  update() {
    this.#renderCalenderContent({ renderScreen: true });
  }

  clearCache() {
    for (const year in this.#state) delete this.#state[year];

    if (this.#currentYear)
      this.#state[this.#currentYear] = this.#initYearCalendarState({
        year: this.#currentYear,
      });

    this.#renderCalenderContent({ renderScreen: true });
  }

  // ----- Getters -------------
  get dateAtCursor() {
    return this.#currentYear
      ? this.#getDateAtCursor({
          cursor: this.#cursor,
          yearDateMatrix: this.#state[this.#currentYear].yearDateMatrix,
        })
      : null;
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

  // getters
  get isFirstDayOfWeekSet() {
    return Boolean(this.#dayNamesArray);
  }
}
