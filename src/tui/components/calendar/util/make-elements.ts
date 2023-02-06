import blessed from "blessed";
import { createInstructionsBox } from "tui/components/instructions";
import type { CalendarElements } from "tui/components/calendar/interface";

export function makeCalendarElements(arg: {
  wrapperWidth: number;
  instructions: { [k: string]: string };
}): CalendarElements {
  const wrapper = blessed.box({
    border: "line",
    scrollable: false,
    width: arg.wrapperWidth,

    style: { focus: { border: { fg: "green" } } },
  });

  const todayText = blessed.box({
    parent: wrapper,

    top: 0,
    height: 1,
    tags: true,
    align: "center",
    content: "hello",
  });

  const calendar = blessed.box({
    parent: wrapper,
    width: "100%",
    left: -1,
    top: 1,
    bottom: 3,

    border: "line",

    keys: true,

    tags: true,
    align: "center",

    scrollable: true,
    scrollbar: {
      ch: " ",
      style: { fg: "white", bg: "grey" },
    },
  });

  const instruction = createInstructionsBox({
    bottom: 0,
    height: 3,
    border: false,
    align: "center",
    parent: wrapper,
    instructions: arg.instructions,
  });

  return Object.freeze({ wrapper, todayText, calendar, instruction });
}
