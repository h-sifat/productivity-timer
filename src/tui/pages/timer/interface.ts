import type {
  TimerInfo,
  TimerInstance,
  TimerMethodCallResult,
} from "src/countdown-timer/type";
import type { TimerRefFromForm } from "./timer-form";
import type { TimerRefWithName } from "src/controllers/timer/interface";

export type TimerEventsEmitter = Pick<TimerInstance<TimerRefWithName>, "on">;

export interface CountDownTimer_TUI_Service {
  [key: string]: () => Promise<any>;
  end(): Promise<TimerMethodCallResult>;
  pause(): Promise<TimerMethodCallResult>;
  reset(): Promise<TimerMethodCallResult>;
  restart(): Promise<TimerMethodCallResult>;
  info(): Promise<TimerInfo<TimerRefWithName>>;
  start(arg?: {
    duration: string;
    ref: TimerRefFromForm | null;
  }): Promise<TimerMethodCallResult>;
}
