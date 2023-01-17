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

export interface BlessedElementStyle {
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
}
