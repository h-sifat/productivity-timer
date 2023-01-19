import type {
  Message,
  ElementPosition,
  BlessedElementStyle,
} from "../interface";
import type { Widgets } from "blessed";

import blessed from "blessed";
import { merge } from "common/util/merge";
import { deepFreeze } from "common/util/other";
import { createInstructionsBox } from "./instructions";
import { hashObject } from "common/util/hash-object";
import { formatMessageForBlessedElement } from "../util";

export interface Form_Argument<T extends object> {
  formLabel?: string;
  fields: Array<keyof T>;
  disabled?: Array<keyof T>;

  initialMessage?: Message;

  renderScreen(): void;

  border?: boolean;
  width?: number | string;
  position?: ElementPosition;
  style?: BlessedElementStyle;
  fieldLabelStyle?: BlessedElementStyle;
  fieldInputStyle?: BlessedElementStyle;
}

const defaultFormStyle = deepFreeze({ focus: { border: { fg: "green" } } });

export interface update_Arg<T> {
  object: Partial<T>;
  message?: Message;
  formLabel?: string;
}

type Field = Readonly<{
  isDisabled: boolean;
  labelElement: blessed.Widgets.TextElement;
  inputElement: blessed.Widgets.TextboxElement | blessed.Widgets.TextElement;
}>;

type OnFormSubmit<T> = (arg: { type: "edit" | "new"; object: T }) => void;

export class Form<T extends object> {
  #renderScreen: () => void;
  #currentObject: T | null = null;
  #messageElement: Widgets.BoxElement;
  #formElement: Widgets.FormElement<T>;

  #onSubmit: OnFormSubmit<T> = () => {};

  readonly #fields: {
    readonly [k: string]: Field;
  };

  constructor(arg: Form_Argument<T>) {
    this.#renderScreen = arg.renderScreen;

    {
      const { width = "100%", position = {} } = arg;
      const style = merge({}, defaultFormStyle, arg.style || {});

      // fields + oneEmptyLine + message + instruction text
      let height = arg.fields.length + 1 + 1 + 1;
      // + border
      if (arg.border) height += 2;

      const formArg: any = { ...position, style, width, keys: true, height };
      if (arg.border) formArg.border = "line";
      if (arg.formLabel) formArg.label = arg.formLabel;

      this.#formElement = blessed.form(formArg);
    }

    {
      const { disabled: disabledFields = [] } = arg;
      this.#fields = arg.fields.reduce((_fieldElements, field, index) => {
        const topPosition = index;

        const inputLabel = `${String(field)}: `;

        const labelElement = blessed.text({
          top: topPosition,
          content: inputLabel,
          parent: this.#formElement,
          style: arg.fieldLabelStyle || {},
        });

        const isDisabled = disabledFields.includes(field);

        const inputElement = isDisabled
          ? blessed.text({
              height: 1,
              content: "",
              top: topPosition,
              left: inputLabel.length,
              parent: this.#formElement,
            })
          : blessed.textbox({
              height: 1,
              value: "",
              top: topPosition,
              inputOnFocus: true,
              name: String(field),
              left: inputLabel.length,
              parent: this.#formElement,
            });

        _fieldElements[field as string] = Object.freeze({
          isDisabled,
          inputElement,
          labelElement,
        });

        return _fieldElements;
      }, {} as { [k: string]: Field });
      Object.freeze(this.#fields);
    }

    // message element
    this.#messageElement = blessed.box({
      tags: true,
      content: "",
      shrink: true,
      align: "left",
      scrollable: false,
      parent: this.#formElement,
      top: arg.fields.length + 1,
    });

    createInstructionsBox({
      bottom: 0,
      height: 1,
      instructions: {
        enter: "submit",
        "s-tab/up": "prev",
        "tab/down": "next",
        escape: "normal mode",
      },
      parent: this.#formElement,
    });

    this.#formElement.key(["enter"], () => {
      this.#formElement.submit();
    });

    this.#formElement.on("submit", (updates: any) => {
      const type = this.#currentObject ? "edit" : "new";
      const updatedObject = { ...(this.#currentObject || {}), ...updates };

      // don't call the submit method if no input has changed
      if (hashObject(this.#currentObject) === hashObject(updatedObject)) return;

      this.#onSubmit({ type, object: updatedObject });
    });

    if (arg.initialMessage)
      this.#updateMessage({ message: arg.initialMessage, renderScreen: false });
  }

  update(arg: update_Arg<T>) {
    {
      const { object: updateObject } = arg;

      for (const [field, value] of Object.entries(this.#fields)) {
        const { isDisabled, inputElement } = value;
        const text =
          field in updateObject ? String((updateObject as any)[field]) : "";

        if (isDisabled) inputElement.setContent(text);
        // @ts-ignore if not disabled then it's a text box element
        else inputElement.setValue(text);
      }

      // convert every value to a string
      this.#currentObject = Object.freeze(
        Object.entries(updateObject).reduce((object, [key, value]) => {
          object[key] = String(value);
          return object;
        }, {} as any)
      );
    }

    if (arg.message)
      this.#updateMessage({ message: arg.message, renderScreen: false });

    if (arg.formLabel) {
      const { formLabel: updatedFormLabel = arg.formLabel } = arg;
      this.#formElement.setLabel(updatedFormLabel);
    }

    this.#renderScreen();
  }

  #updateMessage(arg: { message: Message; renderScreen: boolean }) {
    const { message, renderScreen } = arg;

    this.#messageElement.setContent(formatMessageForBlessedElement(message));
    if (renderScreen) this.#renderScreen();
  }

  updateMessage(message: Message) {
    this.#updateMessage({ message, renderScreen: true });
  }

  get element() {
    return this.#formElement;
  }

  set onSubmit(_onSubmit: OnFormSubmit<T>) {
    this.#onSubmit = _onSubmit;
  }
}
