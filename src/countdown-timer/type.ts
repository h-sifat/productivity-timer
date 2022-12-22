import type {
  TimerData,
  TimerEventLog,
  TimerStateNames,
  TimerElapsedTime,
} from "./timer";

export interface TimerMethodCallResult {
  message: string;
  success: boolean;
}

export type TimerInfo<RefType> = Pick<
  TimerData<RefType>,
  "ref" | "duration" | "logs" | "elapsedTime"
> & { state: TimerStateNames; remainingTime: number };

export type TimeInfo<RefType> = Pick<
  TimerData<RefType>,
  "duration" | "elapsedTime"
> & { remainingTime: number };

export interface ResetEventArg<RefType> {
  previous: TimerInfo<RefType>;
  current: TimerInfo<RefType>;
}
export type DurationChangeEventArg<RefType> = GeneralEventArgument<RefType> & {
  previousDuration: number;
};

export type GeneralEventArgument<RefType> = Pick<
  TimerInfo<RefType>,
  "ref" | "state"
> &
  TimeInfo<RefType>;

export interface TimerInstance<RefType> {
  end(): TimerMethodCallResult;
  pause(): TimerMethodCallResult;
  start(): TimerMethodCallResult;
  setDuration(durationMs: number): TimerMethodCallResult;
  reset(arg?: { duration?: number; ref?: RefType }): TimerMethodCallResult;

  on(
    event: "reset",
    handler: (arg: ResetEventArg<RefType>) => any
  ): TimerInstance<RefType>;
  on(
    event: "start",
    handler: (arg: GeneralEventArgument<RefType>) => any
  ): void;
  on(
    event: "pause",
    handler: (arg: GeneralEventArgument<RefType>) => any
  ): void;
  on(
    event: "err:time_decrement",
    handler: (arg: GeneralEventArgument<RefType>) => any
  ): void;
  on(
    event: "err:wake_up_or_time_increment",
    handler: (arg: GeneralEventArgument<RefType>) => any
  ): void;
  on(event: "time_up", handler: (arg: TimerInfo<RefType>) => any): void;
  on(event: "end_manually", handler: (arg: TimerInfo<RefType>) => any): void;
  on(
    event: "duration_change",
    handler: (arg: DurationChangeEventArg<RefType>) => any
  ): void;
  on(event: "tick", handler: (arg: GeneralEventArgument<RefType>) => any): void;
  on(event: string, handler: (arg: any) => any): TimerInstance<RefType>;

  get duration(): number;
  get info(): TimerInfo<RefType>;
  get ref(): RefType | null;
  get logs(): TimerEventLog[];
  get remainingTime(): number;
  get state(): TimerStateNames;
  get timeInfo(): TimeInfo<RefType>;
  get elapsedTime(): TimerElapsedTime;
}
