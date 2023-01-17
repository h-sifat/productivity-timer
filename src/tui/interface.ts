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
 * return `false` to prevent event propagation.
 * */
export type BlessedKeypressHandler = (
  ch: string | undefined,
  key: BlessedKeyEvent
) => boolean | void;

export interface BGAndFGColor {
  bg: string;
  fg: string;
}
