import type { TimerControllerInterface } from "./interface";
import type { TimerInstance } from "src/countdown-timer/type";
import type { TimerRef } from "entities/work-session/work-session";

import { Speaker } from "src/speaker";
import { makePostTimerCommand } from "./post-command";

export interface makeTimerController_Argument {
  speaker: Speaker;
  timer: TimerInstance<TimerRef>;
  DEFAULT_TIMER_DURATION: number;
}

export function makeTimerController(factoryArg: makeTimerController_Argument) {
  const { timer, speaker, DEFAULT_TIMER_DURATION } = factoryArg;

  const timerController: TimerControllerInterface = {
    post: makePostTimerCommand({ timer, speaker, DEFAULT_TIMER_DURATION }),
  };

  return Object.freeze(timerController);
}
