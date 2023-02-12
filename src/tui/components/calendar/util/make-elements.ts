import blessed from "blessed";
import { pick } from "common/util/other";
import { createInstructionsBox } from "tui/components/instructions";

import type { ElementDimension } from "tui/interface";
import type { Calendar_Argument } from "tui/components/calendar";
import type { CalendarElements } from "tui/components/calendar/interface";

export function makeCalendarElements(
  arg: {
    instructions: { [k: string]: string };
    dimension?: ElementDimension;
  } & Pick<Calendar_Argument, "position">
): CalendarElements {
  const { dimension = {}, position = {} } = arg;

  const wrapper = blessed.box({
    border: "line",
    scrollable: false,
    ...pick(dimension, ["width", "height"]),
    ...pick(position, ["top", "bottom", "left", "right"]),

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

    content: "Loading...",

    scrollable: true,
    scrollbar: {
      ch: " ",
      style: { fg: "white", bg: "grey" },
    },
  });

  calendar.setLabel({ text: "[0000]", side: "right" });

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
