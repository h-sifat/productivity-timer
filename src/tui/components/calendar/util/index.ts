import type {
  Coordinate,
  DayNameInterface,
  DateMatrixOfMonth,
} from "tui/components/calendar/interface";
import type { ReadonlyDeep } from "type-fest";

import { cloneDeep, omit } from "lodash";
import { deepFreeze } from "common/util/other";
import { getDay, getDaysInMonth } from "date-fns";

export const MONTHS_NAMES = Object.freeze([
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const);

export const DAY_NAMES = deepFreeze([
  { name: { long: "Sunday", medium: "Sun", short: "Su" }, index: 0 }, // Sun -> 0
  { name: { long: "Monday", medium: "Mon", short: "Mo" }, index: 1 },
  { name: { long: "Tuesday", medium: "Tue", short: "Tu" }, index: 2 },
  { name: { long: "Wednesday", medium: "Wed", short: "We" }, index: 3 },
  { name: { long: "Thursday", medium: "Thu", short: "Th" }, index: 4 },
  { name: { long: "Friday", medium: "Fri", short: "Fr" }, index: 5 },
  { name: { long: "Saturday", medium: "Sat", short: "Sa" }, index: 6 }, // Sat -> 6
] as const);

/**
 * Array of 7 day names:
 * ```js
 * [
 *    ["saturday", "sat", "sa"],
 *    // ...
 * ]
 * ```
 * */
export const DAY_NAMES_LOWERCASE_TRIPLET_ARRAY = Object.freeze(
  DAY_NAMES.map(({ name }) => Object.values(name)).map((arr) =>
    Object.freeze(arr.map((s) => s.toLowerCase()))
  )
);

export interface getDayNames_Argument {
  firstDay: string;
}
export function getDayNamesBasedOnStartingDay(
  arg: getDayNames_Argument
): DayNameInterface[] {
  const startDay = arg.firstDay.toLowerCase();
  const startDayIndex = DAY_NAMES_LOWERCASE_TRIPLET_ARRAY.findIndex((names) =>
    names.includes(startDay)
  );

  if (startDayIndex === -1) throw new Error(`Invalid start day: "${startDay}"`);

  return Array.from({ length: DAY_NAMES.length }, (_, index) => ({
    ...cloneDeep(<any>DAY_NAMES[(startDayIndex + index) % DAY_NAMES.length]),
  })) as any;
}

export interface getDateMatrixOfMonth_Argument {
  year: number;
  monthIndex: number;
  dayNamesArray: ReadonlyDeep<DayNameInterface[]>;
}

export const MONTH_DATE_MATRIX_INFO = Object.freeze({
  NUM_OF_DAYS_IN_ROW: 7,
  NUM_OF_ROWS_IN_MONTH: 6,
} as const);

export function getDateMatrixOfMonth(
  arg: getDateMatrixOfMonth_Argument
): DateMatrixOfMonth {
  const { year, monthIndex, dayNamesArray } = arg;

  const dateMatrix: DateMatrixOfMonth = Array.from(
    { length: MONTH_DATE_MATRIX_INFO.NUM_OF_ROWS_IN_MONTH },
    () => new Array(MONTH_DATE_MATRIX_INFO.NUM_OF_DAYS_IN_ROW).fill(null)
  );

  {
    const startDate = new Date(year, monthIndex, 1);

    let x = dayNamesArray.findIndex(({ index }) => index === getDay(startDate));
    let y = 0;

    const daysInMonth = getDaysInMonth(startDate);
    for (let dateNumber = 1; dateNumber <= daysInMonth; dateNumber++) {
      const date = new Date(year, monthIndex, dateNumber);
      dateMatrix[y][x] = date;

      if (x < MONTH_DATE_MATRIX_INFO.NUM_OF_DAYS_IN_ROW - 1) x++;
      else if (y < MONTH_DATE_MATRIX_INFO.NUM_OF_ROWS_IN_MONTH) {
        x = 0;
        y++;
      } else throw new Error(`Index out of matrix.`);
    }
  }

  return dateMatrix;
}

export type FormatDateNumber_Argument = {
  cursor: Coordinate;
  dateObject: Date | null;
  formattedDateNumber: string;
};

export interface generateCalendarText_Arg {
  dayNames: readonly string[];
  spaceBetweenDate?: number;
  dateMatrix: ReadonlyDeep<DateMatrixOfMonth>;
  month: { name: string; index: number };

  formatDateNumber?: (arg: FormatDateNumber_Argument) => string;
  formatMonthName?: (name: string) => string;
  formatJoinedDayNames?: (name: string) => string;
}

export function calculateCalendarTextWidth(
  arg: { spaceBetweenDate?: number } = {}
) {
  const DAYS_IN_WEEK = 7;
  const CHAR_PER_DATE = 2;
  const { spaceBetweenDate = 1 } = arg;

  return DAYS_IN_WEEK * CHAR_PER_DATE + (DAYS_IN_WEEK - 1) * spaceBetweenDate;
}

export function generateCalendarText(arg: generateCalendarText_Arg) {
  const {
    month,
    dayNames,
    dateMatrix,
    spaceBetweenDate = 1,

    formatMonthName = (v) => v,
    formatJoinedDayNames = (v) => v,
    formatDateNumber = (v) => v.formattedDateNumber,
  } = arg;

  return [
    formatMonthName(month.name),
    formatJoinedDayNames(dayNames.join(" ".repeat(spaceBetweenDate))),
    ...dateMatrix.map((row, rowIndex) =>
      row
        .map((dateObject, columnIndex) => {
          let formattedDateNumber: string;

          if (!dateObject) formattedDateNumber = "  "; // 2 char
          else {
            const dateNumber = dateObject.getDate();
            formattedDateNumber =
              dateObject.getDate() < 10 ? " " + dateNumber : String(dateNumber);
          }

          return { dateObject, formattedDateNumber, columnIndex };
        })
        .map((arg) =>
          formatDateNumber({
            ...omit(arg, ["columnIndex"]),
            // the cursor will be helpful for formatting date numbers
            cursor: {
              x: arg.columnIndex,
              y:
                rowIndex +
                month.index * MONTH_DATE_MATRIX_INFO.NUM_OF_ROWS_IN_MONTH,
            },
          })
        )
        .join(" ".repeat(spaceBetweenDate))
    ),
  ].join("\n");
}

export function isCoordinateEqual(a: Coordinate, b: Coordinate) {
  return a.x === b.x && a.y === b.y;
}
