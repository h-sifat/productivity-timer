import type {
  Debug,
  Message,
  ElementPosition,
  BlessedKeypressHandler,
} from "../interface";

import blessed from "blessed";
import { SuggestionsElement } from "./suggestions";
import { createInstructionsBox } from "./instructions";
import { formatMessageForBlessedElement } from "../util";
import { setLabelStyleOnFocusAndBlur } from "tui/util/label-style-setter";

type SetMessage_Argument = { timeoutMs?: number | undefined } & Message;

export type OnInputChangeFunc = (
  value: string
) =>
  | void
  | boolean
  | { allowChange: boolean; message: Message; timeoutMs?: number };

export type OnSuggestionSelectFunc = (value: unknown) => void;

export interface InputWithSuggestions_Argument {
  input: {
    name: string;
    label?: string;
    height: number | string;
    parent?: blessed.Widgets.Node;
    instructions?: { [k: string]: string | number };
  } & ElementPosition;
  debug: Debug;
  renderScreen(): void;
  suggestionFormatter(value: unknown): string;
}

const VALID_CHARACTER_REGEX = /^[\S ]{1}$/;
export class InputWithSuggestions {
  #inputValue = "";
  #messageTimeOutId: any;
  #onInputChange: OnInputChangeFunc = () => {};
  #onSuggestionSelect: OnSuggestionSelectFunc = () => {};

  readonly #renderScreen: () => void;
  readonly #suggestionsElement: SuggestionsElement;
  readonly #inputElement: blessed.Widgets.TextboxElement;
  readonly #debug: InputWithSuggestions_Argument["debug"];

  readonly #ARTIFICIAL_CURSOR_TEXT = `{white-bg} {/}`;

  constructor(arg: InputWithSuggestions_Argument) {
    this.#debug = arg.debug;
    this.#renderScreen = arg.renderScreen;

    {
      const { instructions, ...rest } = arg.input;
      this.#inputElement = blessed.textbox({
        ...rest,
        tags: true,
        keys: false,
        border: "line",
        inputOnFocus: false,
        style: {
          fg: "white",
          label: { fg: "white" },
          border: { fg: "white" },
          focus: { border: { fg: "green" } },
        },
      });

      if (instructions)
        createInstructionsBox({
          bottom: 0,
          height: 1,
          instructions,
          parent: this.#inputElement,
        });

      this.#inputElement.on("keypress", this.#handleInputKeyPress);
      this.#inputElement.setIndex(100);

      this.#inputElement.on("focus", () => {
        // set the artificial cursor on focus
        this.setValue({ value: this.value, cursor: true });
        this.#inputElement.setFront();
      });

      this.#inputElement.on("blur", () => {
        // remove the artificial cursor on blur
        this.setValue({ value: this.value, cursor: false });
        this.#inputElement.setBack();
        this.#suggestionsElement.hide();
      });

      setLabelStyleOnFocusAndBlur({
        blurStyle: { fg: "white" },
        element: this.#inputElement,
        focusStyle: { fg: "green" },
        renderScreen: this.#renderScreen,
      });
    }
    {
      this.#suggestionsElement = new SuggestionsElement({
        left: -1,
        height: 6,
        right: -1,
        top: "100%-2",
        parent: this.#inputElement,
        renderScreen: this.#renderScreen,
        suggestionFormatter: arg.suggestionFormatter,
        instructions: {
          enter: "select",
          escape: "close",
          "tab/down": "down",
          "Shift-tab/up": "up",
        },
      });

      this.#suggestionsElement.hide();
    }
  }

  #handleInputKeyPress: BlessedKeypressHandler = (ch, info) => {
    for (const timerId of [this.#messageTimeOutId])
      if (timerId) clearTimeout(timerId);

    {
      const isSingleCharacter =
        ch &&
        ch.length === 1 &&
        // For the backspace (\x7f) ch.length === 1. Adding the next line just
        // to avoid the backspace.
        ("name" in info ? info.name.length === 1 : true) &&
        VALID_CHARACTER_REGEX.test(ch);

      if (isSingleCharacter) {
        this.#updateInput(this.value + ch);
        return false; // don't propagate the event anymore
      }
    }

    if (!("name" in info)) return;

    switch (info.name) {
      case "backspace":
        if (info.sequence === "\x7f")
          this.#updateInput(this.value.slice(0, -1));
        /*
         * when the input element gets blurred then a "backspace" key
         * event is fired to remove the cursor. And this event's info object
         * doesn't contain the "sequence" property. So, I'm using this
         * to remove the artificial cursor
         * */ else this.setValue({ value: this.value, cursor: false });
        return false;

      case "tab":
        if (this.#suggestionsElement.hidden) return true;

        if (info.shift) this.#suggestionsElement.scrollUp();
        else this.#suggestionsElement.scrollDown();
        return false;

      case "up":
        if (!this.#suggestionsElement.hidden)
          this.#suggestionsElement.scrollUp();
        return false;

      case "down":
        if (!this.#suggestionsElement.hidden)
          this.#suggestionsElement.scrollDown();
        return false;

      case "escape":
        // if suggestions element is hidden then let the input element
        // to be blurred on escape
        if (this.#suggestionsElement.hidden) return true;

        // else hide suggestions
        this.#suggestionsElement.hide();
        this.#renderScreen();
        return false;

      case "enter":
        // if suggestions element is hidden then let the form element
        // to be submitted
        if (this.#suggestionsElement.hidden) {
          // @ts-ignore
          this.#inputElement.parent.focus();
          return true;
        }

        this.#onSuggestionSelect(this.#suggestionsElement.selected);
        return false;

      default:
        return false;
    }
  };

  setValue(arg: { value: string; cursor?: boolean }) {
    const { value, cursor = (this.#inputElement as any).focused } = arg;
    this.#inputValue = value;

    let formattedValue = blessed.escape(this.#inputValue);
    if (cursor) formattedValue += this.#ARTIFICIAL_CURSOR_TEXT;

    this.#inputElement.setValue(formattedValue);
    this.#renderScreen();
  }

  get value() {
    return this.#inputValue;
  }

  get suggestionsElement() {
    return this.#suggestionsElement;
  }

  clearMessage() {
    if (this.#messageTimeOutId) clearTimeout(this.#messageTimeOutId);
    this.setValue({ value: this.#inputValue });
    this.#renderScreen();
  }

  setMessage(arg: SetMessage_Argument) {
    const { timeoutMs = null } = arg;
    {
      if (timeoutMs && !(typeof timeoutMs === "number" && timeoutMs > 0))
        throw new TypeError(`Invalid timeoutMs value: ${timeoutMs}`);
    }

    {
      const formattedMessage = formatMessageForBlessedElement(arg);
      this.#inputElement.setValue(
        blessed.escape(this.#inputValue) +
          // this.#ARTIFICIAL_CURSOR_TEXT +
          " " +
          formattedMessage
      );
      this.#renderScreen();
    }

    if (timeoutMs)
      this.#messageTimeOutId = setTimeout(() => {
        this.clearMessage();
      }, timeoutMs);
  }

  set onChange(onInputChange: OnInputChangeFunc) {
    this.#onInputChange = onInputChange;
  }

  set onSuggestionSelect(onSuggestionSelect: OnSuggestionSelectFunc) {
    this.#onSuggestionSelect = onSuggestionSelect;
  }

  #updateInput(newValue: string) {
    const result = this.#onInputChange(newValue);

    if (typeof result !== "object") {
      if (result === undefined || result) this.setValue({ value: newValue });
      return;
    }

    const { allowChange, message, timeoutMs } = result;
    if (allowChange) this.setValue({ value: newValue });
    this.setMessage({ ...message, timeoutMs });
  }

  focus() {
    this.#inputElement.focus();
  }

  get element() {
    return this.#inputElement;
  }
}
