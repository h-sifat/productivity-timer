import type { BGAndFGColor, Message } from "../interface";

const colorsForMessageTypes = Object.freeze({
  error: "red",
  info: "cyan",
  warn: "#ff8000",
  disabled: "grey",
  success: "green",
});
export function formatMessageForBlessedElement(message: Message): string {
  const { text, type } = message;
  if (type === "normal") return text;

  const color = colorsForMessageTypes[type];
  return `{${color}-fg}${text}{/${color}-fg}`;
}

export function formatFgAndBg(arg: {
  style: Partial<BGAndFGColor>;
  value: string;
}) {
  let formatted = arg.value;
  for (const [fgOrBg, color] of Object.entries(arg.style)) {
    formatted = `{${color}-${fgOrBg}}${formatted}{/${color}-${fgOrBg}}`;
  }

  return formatted;
}

interface padTextToForCenterAlignment_Argument {
  text: string;
  width: number;
  paddingChar?: string;
  /**
   * (default: "left"): if there are odd number of spaces then on
   * which side that extra one padding character should be added.
   * */
  heavierSide?: "left" | "right";
}

export function padTextToForCenterAlignment(
  arg: padTextToForCenterAlignment_Argument
) {
  const { text, width } = arg;
  if (text.length >= width) return text;

  const paddingCounts = { left: 0, right: 0 };
  {
    let remainingSpaces = width - text.length;

    // is isOdd
    if (remainingSpaces % 2 === 1) {
      paddingCounts[arg.heavierSide || "left"] = 1;
      remainingSpaces--;
    }

    paddingCounts.left += remainingSpaces / 2;
    paddingCounts.right += remainingSpaces / 2;
  }

  const { paddingChar = " " } = arg;

  return (
    paddingChar.repeat(paddingCounts.left) +
    text +
    paddingChar.repeat(paddingCounts.right)
  );
}
