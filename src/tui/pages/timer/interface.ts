import type { TimerInstance } from "src/countdown-timer/type";
import type { TimerRefWithName } from "src/controllers/timer/interface";

export type TimerEventsEmitter = Pick<TimerInstance<TimerRefWithName>, "on">;
