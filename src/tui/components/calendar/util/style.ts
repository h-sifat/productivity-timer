import type { CalendarStyle } from "../interface";
import type { PartialDeep, ReadonlyDeep } from "type-fest";

export function mergeWithDefaultCalendarStyles(
  style: PartialDeep<ReadonlyDeep<CalendarStyle>> = {}
): CalendarStyle {
  const defaultStyles: CalendarStyle = {
    dayName: { fg: "green" },
    disabled: { fg: "grey" },
    monthName: { fg: "white" },
    today: { fg: "white", bg: "green" },
    cursor: { fg: "black", bg: "white" },
  };

  const mergedStyle: any = { ...style };
  for (const [key, value] of Object.entries(defaultStyles))
    if (!mergedStyle[key]) mergedStyle[key] = value;

  return mergedStyle;
}
