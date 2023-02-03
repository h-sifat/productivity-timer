import type { PartialDeep } from "type-fest";

export type Debug = (...args: any[]) => void;

export type BlessedKeyEvent =
  | { ch: string; full: string }
  | {
      full: string;
      name: string;
      ctrl: boolean;
      meta: boolean;
      shift: boolean;
      sequence: string;
    };

/**
 * return `boolean` to prevent event propagation.
 * */
export type BlessedKeypressHandler = (
  ch: string | undefined,
  key: BlessedKeyEvent
) => boolean | void;

export interface BGAndFGColor {
  bg: string;
  fg: string;
}

export type BlessedElementStyle = PartialDeep<{
  bg: string;
  fg: string;
  bold: boolean;
  blink: boolean;
  inverse: boolean;
  invisible: boolean;
  underline: boolean;
  focus: BGAndFGColor;
  hover: BGAndFGColor;
  border: BGAndFGColor;
  transparent: boolean;
  scrollbar: BGAndFGColor;
}>;

export type ElementPosition = Partial<
  Record<"top" | "bottom" | "left" | "right", number | string>
>;

export type ElementDimension = Partial<
  Record<"width" | "height", string | number>
>;

export interface Message {
  text: string;
  type: "normal" | "info" | "warn" | "error" | "success" | "disabled";
}
