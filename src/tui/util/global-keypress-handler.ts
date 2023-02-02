import { BlessedKeypressHandler } from "tui/interface";

export interface makeAppKeyPressHandler_Arg {
  nextTab(): void;
  prevTab(): void;
  focusNext(): void;
  focusPrev(): void;
  isAnInputElementFocused(): boolean;
}

export function makeGlobalKeypressHandler(
  arg: makeAppKeyPressHandler_Arg
): BlessedKeypressHandler {
  return (_ch, key) => {
    switch (key.full) {
      case "C-j":
      case "C-down":
      case "linefeed":
        arg.focusNext();
        break;

      case "C-k":
      case "C-up":
        arg.focusPrev();
        break;

      case "backspace": // ^H gets registered as backspace
        if (!arg.isAnInputElementFocused()) arg.prevTab();
        break;

      case "C-h":
      case "C-left":
        arg.prevTab();
        break;

      case "C-l":
      case "C-right":
        arg.nextTab();
        break;

      default:
        return true;
    }
    return false;
  };
}
