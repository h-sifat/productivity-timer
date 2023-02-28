import type { Message } from "tui/interface";
import type { TimerEventsEmitter } from "./interface";
import type { TimerComponent } from "./timer-component";
import type { TimerRefFromForm } from "./timer-form";
import type { GeneralEventArgument } from "src/countdown-timer/type";
import type { TimerRefWithName } from "src/controllers/timer/interface";

import { formatDurationMsAsHMS } from "common/util/date-time";

const nameOrIdAbbreviation = Object.freeze({ n: "name", i: "id" });
const refTypeAbbreviation = Object.freeze({ c: "category", p: "project" });

export function getRefObjectFromRefInput(
  value: string
): TimerRefFromForm | null {
  value = value.trim();
  if (value.length < 3) return null;

  // ci, cn, pi, pn
  const refStr = value.slice(0, 2);
  // any input after the "[cp][in]/"
  const identifier = value.slice(3);

  return {
    identifier,
    type: refTypeAbbreviation[refStr[0] as "c" | "p"],
    identifierType: nameOrIdAbbreviation[refStr[1] as "n" | "i"],
  };
}

const eventMessages: { [k: string]: Message } = Object.freeze({
  time_up: { text: "Time up.", type: "success" },
  pause: { text: "Timer paused.", type: "success" },
  start: { text: "Timer started.", type: "success" },
  end_manually: { text: "Timer has been manually ended.", type: "success" },
  "err:time_decrement": {
    type: "error",
    text: "Paused timer because system time has been decremented.",
  },
  "err:wake_up_or_time_increment": {
    type: "warn",
    text: "Paused timer because computer went to sleep or system time has been changed.",
  },
});

export function connectTimerEventsEmitterToTimerComponent(arg: {
  timerComponent: TimerComponent;
  timerEventsEmitter: TimerEventsEmitter;
}) {
  const { timerComponent, timerEventsEmitter } = arg;

  const eventArgToTimerUpdateArg = (arg: {
    eventArg: GeneralEventArgument<TimerRefWithName>;
    eventName: string;
  }) => {
    const { duration, elapsedTime, ref, state } = arg.eventArg;
    const { eventName } = arg;

    const updateArg = {
      message: undefined as any,
      event: undefined as any,
      refInfo: { state: state, ...(ref as any) },
      durationInfo: { targetMs: duration, elapsedMs: elapsedTime.total },
    };

    if (eventName !== "tick")
      updateArg.event = { name: eventName, timestamp: Date.now() };

    if (eventName in eventMessages)
      updateArg.message = eventMessages[eventName];

    return updateArg;
  };

  for (const eventName of [
    "tick",
    "pause",
    "start",
    "time_up",
    "end_manually",
    "err:time_decrement",
    "err:wake_up_or_time_increment",
  ] as const)
    timerEventsEmitter.on(eventName, (eventArg) => {
      timerComponent.update(eventArgToTimerUpdateArg({ eventArg, eventName }));
    });

  timerEventsEmitter.on("reset", (eventArg) => {
    timerComponent.clearEvents();

    const updateArg = eventArgToTimerUpdateArg({
      eventName: "reset",
      eventArg: eventArg.current,
    });
    const message: Message = { text: "Timer has been reset", type: "success" };
    timerComponent.update({ ...updateArg, message });
  });

  timerEventsEmitter.on("duration_change", (eventArg) => {
    const updateArg = eventArgToTimerUpdateArg({
      eventArg: eventArg,
      eventName: "duration_change",
    });

    const currentDuration = formatClockDuration(eventArg.duration);
    const previousDuration = formatClockDuration(eventArg.previousDuration);

    const message: Message = {
      type: "success",
      text: `Timer duration has changed from ${previousDuration} to ${currentDuration}.`,
    };

    timerComponent.update({ ...updateArg, message });
  });
}

export function formatClockDuration(durationMs: number) {
  return formatDurationMsAsHMS({
    separator: ":",
    showUnit: false,
    padWithZero: true,
    duration: durationMs,
    filterZeroValues: false,
  });
}
