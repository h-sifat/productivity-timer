import type { Widgets } from "blessed";
import type { TextStyle } from "tui/interface";

export interface DayNameInterface {
  index: number;
  name: { short: string; medium: string; long: string };
}

export type DateMatrixOfMonth = (Date | null)[][];

export interface Coordinate {
  x: number;
  y: number;
}

export type CalendarElements = Readonly<{
  wrapper: Widgets.BoxElement;
  calendar: Widgets.BoxElement;
  todayText: Widgets.BoxElement;
  instruction: Widgets.BoxElement;
}>;

export interface DateRange {
  end?: Date | undefined;
  start?: Date | undefined;
}

export type CalendarStyle = Record<
  "cursor" | "today" | "disabled" | "dayName" | "monthName",
  Partial<TextStyle>
>;
