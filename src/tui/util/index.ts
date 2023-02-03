import { Message } from "../interface";

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
