import blessed from "blessed";
import type { Widgets } from "blessed";
import type { Debug } from "tui/interface";

export interface Prompt_Argument {
  debug: Debug;
  zIndex: number;
  renderScreen(): void;
}

type Question = { question: string; resolve(arg: boolean): void };

export class PromptComponent {
  readonly #debug: any;
  readonly #renderScreen: () => void;

  readonly #element: Widgets.BoxElement;
  readonly #messageBox: Widgets.BoxElement;

  static height = 8;
  static width = 50;

  #answerCurrentQuestion: Question["resolve"] | null = null;
  readonly #questions: Question[] = [];

  constructor(arg: Prompt_Argument) {
    this.#renderScreen = arg.renderScreen;
    this.#debug = arg.debug;

    this.#element = blessed.box({
      top: "center",
      left: "center",
      border: "line",

      draggable: true,

      width: PromptComponent.width,
      height: PromptComponent.height,

      style: { fg: "green", focus: { border: { fg: "green" } } },
    });

    this.#messageBox = blessed.box({
      parent: this.#element,
      height: PromptComponent.height - 2 - 2,

      tags: true,
      align: "center",

      keyable: false,
      focusable: false,

      mouse: true,
      scrollable: true,

      scrollbar: {
        ch: " ",
        style: { fg: "green", bg: "green" },
        track: { fg: "grey", bg: "grey" },
      },

      style: { fg: "green" },
    });

    // Options box
    blessed.box({
      parent: this.#element,
      align: "center",
      height: 1,
      bottom: 0,
      tags: true,
      content: `{green-fg}Yes (y){/} / {red-fg}No (n){/}`,
    });

    this.#element.setIndex(arg.zIndex);
    this.#element.hide();

    this.#element.key(["y", "enter"], () => {
      if (this.#answerCurrentQuestion) this.#answerCurrentQuestion(true);
    });

    this.#element.key(["n", "escape"], () => {
      if (this.#answerCurrentQuestion) this.#answerCurrentQuestion(false);
    });
  }

  async #askAllQuestions() {
    if (this.#answerCurrentQuestion || !this.#questions.length) return;

    while (this.#questions.length) {
      const currentQuestion = this.#questions.shift()!;

      this.#messageBox.setContent(currentQuestion?.question);
      this.#show();

      const answer: boolean = await new Promise((resolve) => {
        this.#answerCurrentQuestion = resolve;
      });

      currentQuestion.resolve(answer);
      this.#answerCurrentQuestion = null;

      this.#hide();
    }
  }

  #show() {
    this.#element.show();
    this.#element.focus();
    this.#renderScreen();
  }

  #hide() {
    this.#element.hide();
    this.#renderScreen();
  }

  async ask(question: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.#questions.push({ question, resolve });
      this.#askAllQuestions();
    });
  }

  get isVisible() {
    return !this.#element.hidden;
  }

  get element() {
    return this.#element;
  }
}
