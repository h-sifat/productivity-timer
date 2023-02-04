import { cloneDeep } from "lodash";
import { deepFreeze } from "common/util/other";
import { getDay, getDaysInMonth } from "date-fns";
import type { DateMatrixOfMonth, DayNameInterface } from "./interface";

export const MONTHS = Object.freeze([
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

const DAY_NAMES_LOWERCASE = Object.freeze(
  DAY_NAMES.map(({ name }) => Object.values(name)).map((arr) =>
    Object.freeze(arr.map((s) => s.toLowerCase()))
  )
);

export interface getDayNames_Argument {
  startDay: string;
}
export function getDayNamesBasedOnStartingDay(
  arg: getDayNames_Argument
): DayNameInterface[] {
  const startDay = arg.startDay.toLowerCase();
  const startDayIndex = DAY_NAMES_LOWERCASE.findIndex((names) =>
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
  dayNamesArray: DayNameInterface[];
}
export function getDateMatrixOfMonth(
  arg: getDateMatrixOfMonth_Argument
): DateMatrixOfMonth {
  const { year, monthIndex, dayNamesArray } = arg;

  const NUM_OF_DAYS_IN_ROW = 7;
  const NUM_OF_ROWS_IN_MONTH = 6;

  const dateMatrix: DateMatrixOfMonth = Array.from(
    { length: NUM_OF_ROWS_IN_MONTH },
    () => new Array(NUM_OF_DAYS_IN_ROW).fill(null)
  );

  {
    const startDate = new Date(year, monthIndex, 1);

    let x = (() => {
      const startDayIndex = getDay(startDate);
      return dayNamesArray.findIndex(({ index }) => index === startDayIndex);
    })();

    let y = 0;

    const daysInMonth = getDaysInMonth(startDate);
    for (let dateNumber = 1; dateNumber <= daysInMonth; dateNumber++) {
      const date = new Date(year, monthIndex, dateNumber);
      dateMatrix[y][x] = date;

      if (x < NUM_OF_DAYS_IN_ROW - 1) x++;
      else if (y < NUM_OF_ROWS_IN_MONTH) {
        x = 0;
        y++;
      } else throw new Error(`Index out of matrix.`);
    }
  }

  return dateMatrix;
}

export interface generateCalenderText_Arg {
  monthName: string;
  dayNames: string[];
  spaceBetweenDate?: number;
  dateMatrix: DateMatrixOfMonth;

  formatDateNumber?: (arg: {
    dateObject: Date | null;
    formattedDateNumber: string;
  }) => string;
  formatMonthName?: (name: string) => string;
  formatJoinedDayNames?: (name: string) => string;
}

export function generateCalenderText(arg: generateCalenderText_Arg) {
  const {
    dayNames,
    monthName,
    dateMatrix,
    spaceBetweenDate = 1,

    formatMonthName = (v) => v,
    formatJoinedDayNames = (v) => v,
    formatDateNumber = (v) => v.formattedDateNumber,
  } = arg;

  return [
    formatMonthName(monthName),
    formatJoinedDayNames(dayNames.join(" ".repeat(spaceBetweenDate))),
    ...dateMatrix.map((row) =>
      row
        .map((dateObject) => {
          let formattedDateNumber: string;

          if (!dateObject) formattedDateNumber = "  "; // 2 char
          else {
            const dateNumber = dateObject.getDate();
            formattedDateNumber =
              dateObject.getDate() < 10 ? " " + dateNumber : String(dateNumber);
          }

          return { dateObject, formattedDateNumber };
        })
        .map(formatDateNumber)
        .join(" ".repeat(spaceBetweenDate))
    ),
  ].join("\n");
}
