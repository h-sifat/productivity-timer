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
    style = {},
    instructions,
    border = false,
    keyColor = "green",
    ...rest
  } = arg;
  const options: any = {
    align: "center",

    ...rest,
    style,
    tags: true,
    mouse: true,
    scrollable: true,
    content: Object.entries(instructions)
      .map(([key, action]) => `{${keyColor}-fg}${key}{/}: ${action}`)
      .join(", "),
  };

  if (border) options.border = "line";

  return blessed.box(options);
}
