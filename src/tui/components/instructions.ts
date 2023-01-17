import blessed from "blessed";
import { BGAndFGColor } from "../interface";

export type createInstructionsBox_Argument = Partial<
  Record<
    "top" | "left" | "right" | "width" | "bottom" | "height",
    string | number
  >
> & {
  keyColor?: string;
  style?: Partial<BGAndFGColor>;
  parent?: blessed.Widgets.Node;
  align?: "center" | "left" | "right";
  instructions: { [k: string]: string | number };
};

export function createInstructionsBox(arg: createInstructionsBox_Argument) {
  const { instructions, style = {}, keyColor = "green", ...rest } = arg;
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

  return blessed.box(options);
}
