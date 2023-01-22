import blessed from "blessed";
import { createInstructionsBox } from "tui/components/instructions";
import { InputWithSuggestions } from "tui/components/input-with-suggestions";

import type {
  Debug,
  Message,
  ElementPosition,
  ElementDimension,
} from "tui/interface";
import type { Widgets } from "blessed";
import { getRefObjectFromRefInput } from "./util";

export interface TimerRefFromForm {
  identifier: string;
  type: "category" | "project";
  identifierType: "name" | "id";
}

export interface TimerForm_Argument {
  debug: Debug;
  renderScreen(): void;
  position?: ElementPosition;
  dimension?: ElementDimension;
  getRefInputSuggestions(ref: TimerRefFromForm): { name: string; id: string }[];
}

const refInputInstructions = Object.freeze({
  i: "id",
  n: "name",
  p: "project",
  c: "category",
  examples: "ci/2, pi/32, cn/study, pn/todo",
});

export type OnTimerFormSubmit = (info: {
  duration: string;
  ref: TimerRefFromForm | null;
}) => void;

export class TimerForm {
  static readonly height = 11;
  readonly #formElement: Widgets.FormElement<any>;
  readonly #referenceInput: InputWithSuggestions;
  readonly #durationInput: Widgets.TextboxElement;

  readonly #debug: Debug;
  readonly #renderScreen: () => void;

  #onSubmit: OnTimerFormSubmit = () => {};

  constructor(arg: TimerForm_Argument) {
    this.#debug = arg.debug;
    this.#renderScreen = arg.renderScreen;

    this.#formElement = blessed.form({
      ...arg.position,
      ...arg.dimension,
      keys: true,
      border: "line",
      left: "center",
      height: TimerForm.height,
      // @ts-ignore I don't know why the "center" option is not working
      label: { text: "[New Timer Info]", side: "right" },
      style: { focus: { border: { fg: "green" } } },
    });

    this.#referenceInput = new InputWithSuggestions({
      debug: arg.debug,
      renderScreen: arg.renderScreen,
      suggestionFormatter({ name, id, parentId }: any) {
        return `${name} (id: ${id}${parentId ? " pid: " + parentId : ""})`;
      },
      input: {
        height: 4,
        name: "ref",
        parent: this.#formElement,
        label: "[Reference: [cp][in]/*]",
        instructions: refInputInstructions,
      },
    });

    this.#durationInput = blessed.textbox({
      top: 4,
      height: 3,
      keys: true,
      border: "line",
      name: "duration",
      inputOnFocus: true,
      label: "[duration]",
      parent: this.#formElement,
      style: { focus: { border: { fg: "green" } } },
    });

    // setting zIndex to zero so that it doesn't overlap the suggestions;
    this.#durationInput.setIndex(0);

    {
      const instructionBox = createInstructionsBox({
        height: 1,
        bottom: 0,
        parent: this.#formElement,
        instructions: {
          enter: "submit",
          "tab/down": "next",
          "shift-tab/up": "prev",
          escape: "normal mode/close",
        },
      });

      // setting zIndex to zero so that it doesn't overlap the suggestions;
      instructionBox.setIndex(0);
    }

    this.#setUpFormKeyBindings();
    this.#setUpRefInputChangeAndSuggestionHandling({
      getRefInputSuggestions: arg.getRefInputSuggestions,
    });
  }

  #setUpFormKeyBindings() {
    // adding key bindings for the form element.
    this.#formElement.key(["enter"], () => {
      this.#formElement.submit();
    });

    this.#formElement.on("submit", (data: any) => {
      const { duration, ref: refStr } = data;

      this.#onSubmit({ duration, ref: getRefObjectFromRefInput(refStr) });
      this.#clearContent();
      this.hide();
    });

    this.#formElement.key("escape", () => {
      this.hide();
    });
  }

  #setUpRefInputChangeAndSuggestionHandling(
    arg: Pick<TimerForm_Argument, "getRefInputSuggestions">
  ) {
    const valuePattern = /^[cp]([in](\/(\S.*)?)?)?$/;

    this.#referenceInput.onSuggestionSelect = (projectOrCategory: any) => {
      this.#referenceInput.setValue({
        value: this.#referenceInput.value.slice(0, 3) + projectOrCategory.name,
      });
    };

    // if returns true | void => update input otherwise don't
    this.#referenceInput.onChange = (value) => {
      if (value.length < 3 && !this.#referenceInput.suggestionsElement.hidden) {
        this.#referenceInput.suggestionsElement.hide();
        this.#referenceInput.suggestionsElement.clear();
      }

      if (!value.length) return true;

      // if the value is invalid then show an error message
      if (!valuePattern.test(value)) {
        this.#referenceInput.setMessage({
          type: "error",
          timeoutMs: 300,
          text: "Invalid Input.",
        });

        // and don't update the input with invalid value
        return false;
      }

      // only show suggestions if value.length >= 3 i.e. after "[cp][in]/"
      if (value.length < 3) return true;

      // as the input is being validated by regex we don't need to
      // worry about the ref being null
      const ref = getRefObjectFromRefInput(value) as TimerRefFromForm;
      const suggestions = arg.getRefInputSuggestions(ref);

      if (ref.identifierType === "name") {
        this.#referenceInput.suggestionsElement.suggestions = suggestions;
        return true;
      }

      // if the id is empty string then return
      if (!ref.identifier) return true;

      // now ref.identifierType = id
      const message: Message = !suggestions.length
        ? { text: "Not found!", type: "error" }
        : { text: suggestions[0].name, type: "success" };

      return { allowChange: true, message };
    };
  }

  show() {
    if (!this.#formElement.hidden) return;

    this.#formElement.show();
    this.#formElement.focus();

    this.#renderScreen();
  }

  hide() {
    if (this.#formElement.hidden) return;

    this.#formElement.hide();
    // @ts-ignore
    this.#formElement.parent.focus();

    this.#renderScreen();
  }

  #clearContent() {
    this.#referenceInput.setValue({ value: "" });
    this.#durationInput.setValue("");
  }

  get element() {
    return this.#formElement;
  }

  set onSubmit(onSubmit: OnTimerFormSubmit) {
    this.#onSubmit = onSubmit;
  }
}
