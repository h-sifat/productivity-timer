import { DateRange } from "../interface";
import { isAfter, isBefore } from "date-fns";
import { z } from "zod";

export function isDateWithinRange(
  date: Date,
  range: Readonly<Partial<DateRange>>
) {
  const { start, end } = range;

  const isInvalid =
    (start && isBefore(date, start)) || (end && isAfter(date, end)) || false;

  return !isInvalid;
}

export function isYearWithinRange(
  year: number,
  range: Readonly<Partial<DateRange>>
) {
  const { start, end } = range;

  const isInvalid =
    (start && year < start.getFullYear()) ||
    (end && year > end.getFullYear()) ||
    false;

  return !isInvalid;
}

export const DateRangeSchema = z
  .object({
    end: z.date().optional(),
    start: z.date().optional(),
  })
  .strict()
  .refine(({ start, end }) => (start && end ? isBefore(start, end) : true), {
    message: "Invalid range.",
  });
