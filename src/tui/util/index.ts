import { Widgets } from "blessed";
import { ReadonlyDeep } from "type-fest";
import type { BGAndFGColor, Message, TextStyle } from "tui/interface";

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

export function formatTextForBlessedElement(arg: {
  text: string;
  style: Partial<ReadonlyDeep<TextStyle>>;
}) {
  let formatted = arg.text;
  for (let [attribute, value] of Object.entries(arg.style)) {
    let tag: string;

    if (attribute === "fg" || attribute == "bg") tag = `${value}-${attribute}`;
    // e.g., bold: true
    else if (value) tag = attribute;
    else continue;

    formatted = `{${tag}}${formatted}{/${tag}}`;
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

/**
 * I could not update the style of a label through the element.style property.
 * So, I dug a little bit into the blessed's source code and discovered that a
 * label on any element is internally created with a box and it can be accessed
 * through the "_label" property. */
export function setElementsLabelStyle(arg: {
  element: Widgets.BlessedElement;
  style: any;
}) {
  const { element, style } = arg;

  // @ts-expect-error internal property
  if (element._label) element._label.style = style;
}
