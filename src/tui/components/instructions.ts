import blessed from "blessed";
import { BGAndFGColor } from "../interface";

export type createInstructionsBox_Argument = Partial<
  Record<
    "top" | "left" | "right" | "width" | "bottom" | "height",
    string | number
  >
> & {
  border?: boolean;
  keyColor?: string;
  style?: Partial<BGAndFGColor>;
  parent?: blessed.Widgets.Node;
  align?: "center" | "left" | "right";
  instructions: { [k: string]: string | number };
};

export function createInstructionsBox(arg: createInstructionsBox_Argument) {
  const {
    instructions,
    border = false,
    keyColor = "green",
    style = { fg: "white", border: { fg: "white" } },
    ...rest
  } = arg;
  const options: any = {
    align: "center",

    ...rest,
    style,
    tags: true,
    mouse: true,
    focusable: false,
    scrollable: true,
    content: Object.entries(instructions)
      .map(
        ([key, action]) => `{${keyColor}-fg}${key}{/}{white-fg}: ${action}{/}`
      )
      .join(", "),
  };

  if (border) options.border = "line";

  return blessed.box(options);
}
