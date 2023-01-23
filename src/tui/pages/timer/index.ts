import blessed from "blessed";
import { Page } from "tui/components/page";
import { TimerComponent } from "./timer-component";
import { TimerForm, TimerForm_Argument } from "./timer-form";
import { connectTimerEventsEmitterToTimerComponent } from "./util";
import { createInstructionsBox } from "tui/components/instructions";

import type {
  TimerEventsEmitter,
  CountDownTimer_TUI_Service,
} from "./interface";
import type { BlessedKeyEvent, Debug } from "tui/interface";

const KeyBindings: {
  [k: string]: { command: string; keyLabel: string; description: string };
} = Object.entries({
  e: "end",
  c: "reset",
  p: "pause",
  s: "start",
  r: "restart",
  b: { command: "info", keyLabel: "b", description: "stop beeping" },
  "S-s": { command: "start", keyLabel: "shift-s", description: "start new" },

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
  timerEventsEmitter: TimerEventsEmitter;
  CountDownTimerService: CountDownTimer_TUI_Service;
  getRefInputSuggestions: TimerForm_Argument["getRefInputSuggestions"];
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

    height: 5,
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
    dimension: { width: "90%" },
    getRefInputSuggestions: arg.getRefInputSuggestions,
  });

  startNewTimerForm.onSubmit = async (startArg) => {
    if (!startArg.duration && !startArg.ref) return;

    try {
      await arg.CountDownTimerService.start(startArg);
    } catch (ex) {
      timerComponent.setMessage({ text: ex.message, type: "error" });
    }
  };

  wrapper.append(startNewTimerForm.element);
  startNewTimerForm.element.hide();

  wrapper.on("keypress", async (_, key: BlessedKeyEvent) => {
    switch (key.full) {
      case "S-s":
        startNewTimerForm.show();
        break;

      default:
        if (!(key.full in KeyBindings)) return;
        const command = KeyBindings[key.full].command;

        try {
          await arg.CountDownTimerService[command]();
        } catch (ex) {
          timerComponent.setMessage({ text: ex.message, type: "error" });
        }
    }
  });

  const timerPage = new Page({
    top: 1,
    debug: arg.debug,
    children: [wrapper],
  });

  return { timerPage, timerComponent, timerForm: startNewTimerForm };
}
