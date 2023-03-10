import blessed from "blessed";
import { TimerForm } from "./timer-form";
import { pick } from "common/util/other";
import { Page } from "tui/components/page";
import { TimerComponent } from "./timer-component";
import { GetTimerFormSuggestions } from "./suggestions-provider";
import { connectTimerEventsEmitterToTimerComponent } from "./util";
import { createInstructionsBox } from "tui/components/instructions";
import { MS_IN_ONE_MINUTE, parseDuration } from "common/util/date-time";

import type {
  TimerService,
  TimerCommand_Arguments,
} from "client/services/timer";
import type { TimerEventsEmitter } from "./interface";
import type { BlessedKeyEvent, Debug } from "tui/interface";

const SHORT_BREAK_DURATION = MS_IN_ONE_MINUTE * 5;
const LONG_BREAK_DURATION = MS_IN_ONE_MINUTE * 15;

const KeyBindings: {
  [k: string]: {
    arg?: any;
    command: string;
    keyLabel: string;
    description: string;
  };
} = Object.entries({
  e: "end",
  p: "pause",
  s: "start",
  "S-c": { keyLabel: "shift-c", command: "reset", description: "reset" },
  "S-r": { keyLabel: "shift-r", command: "restart", description: "restart" },
  b: {
    keyLabel: "b",
    command: "startBreak",
    arg: { duration: SHORT_BREAK_DURATION },
    description: `break (${SHORT_BREAK_DURATION / MS_IN_ONE_MINUTE}m)`,
  },
  "S-b": {
    keyLabel: "shift-b",
    command: "startBreak",
    arg: { duration: LONG_BREAK_DURATION },
    description: `break (${LONG_BREAK_DURATION / MS_IN_ONE_MINUTE}m)`,
  },
  "S-s": { command: "start", keyLabel: "shift-s", description: "start new" },
  m: { command: "mute", keyLabel: "m", description: "mute alarm" },
  l: {
    keyLabel: "l",
    command: "start",
    arg: { usePreviousRef: true },
    description: "start last non-break timer",
  },

  // too lazy to implement another form
  // d: { command: "setDuration", keyLabel: "d", description: "change duration" },
})
  .map(([key, value]) =>
    typeof value === "string"
      ? [key, { command: value, keyLabel: key, description: value }]
      : [key, value]
  )
  .reduce((_keyBindings, [k, v]: any) => {
    _keyBindings[k] = v;
    return _keyBindings;
  }, {} as any);

export interface createTimerPage_Argument {
  debug: Debug;
  renderScreen(): void;
  CountDownTimerService: TimerService;
  timerEventsEmitter: TimerEventsEmitter;
  getTimerFormSuggestions: GetTimerFormSuggestions;
}
export function createTimerPage(arg: createTimerPage_Argument) {
  const { debug, renderScreen } = arg;

  const wrapper = blessed.box({ top: "50%-11" });

  const timerComponent = new TimerComponent({
    debug,
    renderScreen,
    position: { left: "center" },
  });

  connectTimerEventsEmitterToTimerComponent({
    timerComponent,
    timerEventsEmitter: arg.timerEventsEmitter,
  });

  wrapper.append(timerComponent.element);

  createInstructionsBox({
    parent: wrapper,

    left: "center",
    top: TimerComponent.height - 1,

    height: 6,
    width: TimerComponent.width,

    border: true,
    align: "center",
    instructions: Object.values(KeyBindings).reduce(
      (instructions, { keyLabel, description }) => {
        instructions[keyLabel] = description;
        return instructions;
      },
      {} as any
    ),
  });

  const startNewTimerForm = new TimerForm({
    debug,
    renderScreen,
    position: { top: 2 },
    dimension: { width: "35%+40" },
    getRefInputSuggestions: arg.getTimerFormSuggestions,
  });

  wrapper.append(startNewTimerForm.element);
  startNewTimerForm.element.hide();

  startNewTimerForm.onSubmit = async (data) => {
    const { duration, ref = null } = data;
    if (!duration && !ref) return;

    try {
      const startArg: TimerCommand_Arguments["start"] = { ref: null };
      if (ref) {
        const suggestions = arg.getTimerFormSuggestions(ref, {
          exactMatch: true,
        });
        if (!suggestions.length)
          throw new Error(
            `No ${ref.type} found with ${ref.identifierType} "${ref.identifier}".`
          );
        else if (suggestions.length > 1)
          throw new Error(`Ambiguous ${ref.identifierType}.`);

        const projectOrCategory = suggestions[0];
        startArg.ref = {
          type: ref.type,
          ...pick(projectOrCategory, ["name", "id"]),
        };
      }

      if (duration) startArg.duration = parseDuration(duration);

      await arg.CountDownTimerService.start(startArg);
    } catch (ex) {
      timerComponent.setMessage({ text: ex.message, type: "error" });
    }
  };

  wrapper.on("keypress", async (_, key: BlessedKeyEvent) => {
    switch (key.full) {
      case "S-s":
        startNewTimerForm.show();
        break;

      default:
        if (!(key.full in KeyBindings)) return;
        const keyBinding = KeyBindings[key.full];

        try {
          await (<any>arg.CountDownTimerService)[keyBinding.command](
            keyBinding.arg
          );
        } catch (ex) {
          timerComponent.setMessage({ text: ex.message, type: "error" });
        }
    }
  });

  // if we come back to the timer page and the form is still open
  // then focus the form element.
  wrapper.on("focus", () => {
    if (!startNewTimerForm.element.hidden) startNewTimerForm.element.focus();
    renderScreen();
  });

  const timerPage = new Page({
    top: 1,
    renderScreen,
    debug: arg.debug,
    children: [wrapper],
  });

  return { timerPage, timerComponent, timerForm: startNewTimerForm };
}
