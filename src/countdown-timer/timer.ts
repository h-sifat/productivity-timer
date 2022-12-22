import EPP from "common/util/epp";
import EventEmitter from "events";
import { assert, is } from "handy-types";

export type TimerEventNames =
  | "pause"
  | "tick"
  | "reset"
  | "start"
  | "time_up"
  | "end_manually"
  | "duration_change"
  | "err:time_decrement"
  | "err:wake_up_or_time_increment";

export type TimerEventLog = Readonly<{
  timestamp: number;
  name: "start" | "pause" | "time_up" | "end_manually";
}>;

export interface TimerElapsedTime {
  total: number;
  byDate: {
    [key: string]: number;
  };
}

export enum TimerStates {
  "ENDED" = 1,
  "PAUSED",
  "RUNNING",
  "TIMED_UP",
  "NOT_STARTED",
}

Object.freeze(TimerStates);

export type TimerStateNames =
  | "ENDED"
  | "PAUSED"
  | "RUNNING"
  | "TIMED_UP"
  | "NOT_STARTED";

export interface TimerData<RefType> {
  ref: RefType | null;
  duration: number;
  state: TimerStates;
  logs: TimerEventLog[];
  lastTick: number | null;
  elapsedTime: TimerElapsedTime;
}

export interface Constructor_Argument<RefType> {
  currentTimeMs(): number;
  TICK_INTERVAL_MS: number;
  MAX_ALLOWED_TICK_DIFF_MS: number;
  MIN_ALLOWED_TICK_DIFF_MS?: number;
  clearInterval(timerId: any): void;
  getDateFromTimeMs(time: number): string;
  assertValidRef(ref: unknown): asserts ref is RefType;
  setInterval(arg: { interval: number; callback: Function }): any;
}

export const DEFAULT_TIMER_DURATION = 25 * 60 * 1000; // 25 minutes
export const INVALID_ACTION_FOR_STATE_MESSAGES = Object.freeze({
  [TimerStates.TIMED_UP]: "Timer has timed up.",
  [TimerStates.PAUSED]: "Timer is already paused.",
  [TimerStates.RUNNING]: "Timer is already running.",
  [TimerStates.ENDED]: "Timer has been ended manually.",
  [TimerStates.NOT_STARTED]: "Timer hasn't started yet.",
});

function getDefaultTimerData<RefType>(): TimerData<RefType> {
  return {
    logs: [],
    ref: null,
    lastTick: null,
    state: TimerStates.NOT_STARTED,
    duration: DEFAULT_TIMER_DURATION,
    elapsedTime: { total: 0, byDate: {} },
  };
}

export default class CountDownTimer<RefType> extends EventEmitter {
  #data: TimerData<RefType> = { ...getDefaultTimerData() };

  #tickIntervalId: NodeJS.Timer | null = null;
  readonly #MIN_ALLOWED_TICK_DIFF_MS: number;
  readonly #setInterval: Constructor_Argument<RefType>["setInterval"];
  readonly #clearInterval: Constructor_Argument<RefType>["clearInterval"];
  readonly #currentTimeMs: Constructor_Argument<RefType>["currentTimeMs"];
  readonly #assertValidRef: Constructor_Argument<RefType>["assertValidRef"];
  readonly #TICK_INTERVAL_MS: Constructor_Argument<RefType>["TICK_INTERVAL_MS"];
  readonly #getDateFromTimeMs: Constructor_Argument<RefType>["getDateFromTimeMs"];
  readonly #MAX_ALLOWED_TICK_DIFF_MS: Constructor_Argument<RefType>["MAX_ALLOWED_TICK_DIFF_MS"];

  constructor(arg: Constructor_Argument<RefType>) {
    super();

    this.#setInterval = arg.setInterval;
    this.#clearInterval = arg.clearInterval;
    this.#currentTimeMs = arg.currentTimeMs;
    this.#assertValidRef = arg.assertValidRef;
    this.#getDateFromTimeMs = arg.getDateFromTimeMs;

    assert<number>("positive_integer", arg.TICK_INTERVAL_MS, {
      name: "TICK_INTERVAL_MS",
      code: "INVALID_TICK_INTERVAL_MS",
    });

    this.#TICK_INTERVAL_MS = arg.TICK_INTERVAL_MS;

    if ("MIN_ALLOWED_TICK_DIFF_MS" in arg) {
      assert<number>("positive_integer", arg.MIN_ALLOWED_TICK_DIFF_MS, {
        name: "MIN_ALLOWED_TICK_DIFF_MS",
        code: "INVALID_MIN_ALLOWED_TICK_DIFF_MS",
      });

      if (arg.MIN_ALLOWED_TICK_DIFF_MS >= this.#TICK_INTERVAL_MS)
        throw new EPP({
          code: "INVALID_MIN_ALLOWED_TICK_DIFF_MS",
          message: `The MIN_ALLOWED_TICK_DIFF_MS must be less the TICK_INTERVAL_MS.`,
        });

      this.#MIN_ALLOWED_TICK_DIFF_MS = arg.MIN_ALLOWED_TICK_DIFF_MS;
    } else this.#MIN_ALLOWED_TICK_DIFF_MS = this.#TICK_INTERVAL_MS - 10; // 10ms

    if (arg.MAX_ALLOWED_TICK_DIFF_MS <= this.#TICK_INTERVAL_MS)
      throw new EPP({
        code: "INVALID_MAX_ALLOWED_TICK_DIFF_MS",
        message: `The MAX_ALLOWED_TICK_DIFF_MS: ${
          arg.MAX_ALLOWED_TICK_DIFF_MS
        } must be greater than the TICK_INTERVAL_MS (${
          this.#TICK_INTERVAL_MS
        })`,
      });

    this.#MAX_ALLOWED_TICK_DIFF_MS = arg.MAX_ALLOWED_TICK_DIFF_MS;
  }

  start() {
    const callTimestamp = this.#currentTimeMs();
    const state = this.#data.state;

    if (![TimerStates.PAUSED, TimerStates.NOT_STARTED].includes(state))
      return {
        success: false,
        message: INVALID_ACTION_FOR_STATE_MESSAGES[state],
      };

    if (this.#data.logs.length) {
      const lastEventTimestamp =
        this.#data.logs[this.#data.logs.length - 1].timestamp;

      if (callTimestamp < lastEventTimestamp)
        return {
          success: false,
          message: `Can't start timer (invalid time). Sadly, we can't go back to the past :(`,
        };
    }

    this.#tickIntervalId = this.#setInterval({
      callback: () => this.#tick(),
      interval: this.#TICK_INTERVAL_MS,
    });

    this.#data.logs.push(this.#generateLog("start", callTimestamp));

    this.#data.state = TimerStates.RUNNING;

    this.emit("start", this.#getEventArgument());

    {
      const message =
        state === TimerStates.PAUSED ? `Resumed timer.` : `Started timer.`;
      return { success: true, message };
    }
  }

  pause() {
    const callTimestamp = this.#currentTimeMs();
    const state = this.#data.state;

    if (state !== TimerStates.RUNNING)
      return {
        success: false,
        message: INVALID_ACTION_FOR_STATE_MESSAGES[state],
      };

    this.#clearInterval(this.#tickIntervalId!);
    this.#tickIntervalId = null;

    this.#data.logs.push(this.#generateLog("pause", callTimestamp));

    this.#data.state = TimerStates.PAUSED;
    this.#data.lastTick = null; // otherwise on the next start we may get "err:wake_up_or_time_increment"

    this.emit("pause", this.#getEventArgument());

    return { success: true, message: `Paused timer.` };
  }

  end() {
    const callTimestamp = this.#currentTimeMs();
    {
      const state = this.#data.state;

      if (![TimerStates.PAUSED, TimerStates.RUNNING].includes(state))
        return {
          success: false,
          message: INVALID_ACTION_FOR_STATE_MESSAGES[state],
        };
    }

    this.#clearInterval(this.#tickIntervalId!);

    this.#data.logs.push(this.#generateLog("end_manually", callTimestamp));

    this.#data.state = TimerStates.ENDED;
    this.emit("end_manually", this.info);

    return { success: true, message: `Ended timer.` };
  }

  #generateLog(event: TimerEventLog["name"], timestamp: number) {
    return Object.freeze({ name: event, timestamp });
  }

  #getEventArgument() {
    return { ref: this.ref, ...this.timeInfo, state: this.state };
  }

  #pauseUrgently(timestamp: number) {
    this.#assertTimerIsRunning();

    this.#clearInterval(this.#tickIntervalId!);
    this.#data.state = TimerStates.PAUSED;
    this.#data.logs.push(this.#generateLog("pause", timestamp));
    this.#data.lastTick = null; // otherwise on the next start we'll get "err:wake_up_or_time_increment" error
  }

  #tick() {
    const callTimestamp = this.#currentTimeMs();

    if (this.#data.lastTick) {
      const tickDiff = callTimestamp - this.#data.lastTick;

      if (tickDiff < this.#MIN_ALLOWED_TICK_DIFF_MS) {
        this.#pauseUrgently(this.#data.lastTick);
        this.emit("err:time_decrement", this.#getEventArgument());

        return;
      } else if (tickDiff > this.#MAX_ALLOWED_TICK_DIFF_MS) {
        this.#pauseUrgently(this.#data.lastTick);
        this.emit("err:wake_up_or_time_increment", this.#getEventArgument());

        return;
      }
    }

    this.#incrementElapsedTime(callTimestamp);

    if (this.#data.elapsedTime.total >= this.#data.duration) {
      this.#timeUp(callTimestamp);
      return;
    }

    this.emit("tick", this.#getEventArgument());

    this.#data.lastTick = callTimestamp;
  }

  #incrementElapsedTime(callTimestamp: number) {
    const currentDate = this.#getDateFromTimeMs(callTimestamp);

    this.#data.elapsedTime.total += this.#TICK_INTERVAL_MS;

    if (currentDate in this.#data.elapsedTime.byDate)
      this.#data.elapsedTime.byDate[currentDate] += this.#TICK_INTERVAL_MS;
    else this.#data.elapsedTime.byDate[currentDate] = this.#TICK_INTERVAL_MS;
  }

  #timeUp(callTimestamp: number) {
    if (!this.#tickIntervalId)
      throw new EPP({
        code: "IE:NO_TIMER_ID",
        message: "Internal error from #timeUp(): no tickIntervalId.",
      });
    this.#assertTimerIsRunning();

    this.#clearInterval(this.#tickIntervalId);

    this.#data.state = TimerStates.TIMED_UP;
    this.#data.logs.push(this.#generateLog("time_up", callTimestamp));

    this.emit("time_up", this.info);
  }

  #assertTimerIsRunning() {
    if (this.#data.state !== TimerStates.RUNNING)
      throw new EPP({
        code: "IE:TIMER_NOT_RUNNING",
        message: "Internal error from #timeUp(): timer is not running.",
      });
  }

  reset(arg: { duration?: number; ref?: RefType } = {}) {
    const defaultTimerData = getDefaultTimerData<RefType>();

    if ("duration" in arg)
      try {
        this.#assertDurationIsValidAndCanBeSet({
          totalElapsedTime: 0,
          duration: arg.duration,
          state: TimerStates.NOT_STARTED,
        });

        defaultTimerData.duration = arg.duration;
      } catch (ex) {
        return { success: false, message: ex.message };
      }

    if ("ref" in arg)
      try {
        this.#assertValidRef(arg.ref);
        defaultTimerData.ref = arg.ref;
      } catch (ex) {
        return { success: false, message: ex.message };
      }

    if (this.#tickIntervalId) this.#clearInterval(this.#tickIntervalId);

    const previousInfo = this.info;

    this.#data = defaultTimerData;

    this.emit("reset", { previous: previousInfo, current: this.info });

    return { success: true, message: "Reset timer to initial state." };
  }

  #assertDurationIsValidAndCanBeSet(arg: {
    duration: number;
    state: TimerStates;
    totalElapsedTime: number;
  }) {
    const { duration, state, totalElapsedTime } = arg;

    let message = "";

    if (!is<number>("positive_integer", duration))
      message = `Duration must be a positive integer.`;
    else if (duration % this.#TICK_INTERVAL_MS)
      message = `Duration must be a multiple of tick interval (${
        this.#TICK_INTERVAL_MS
      }ms)`;
    else if (![TimerStates.NOT_STARTED, TimerStates.PAUSED].includes(state))
      message = `Duration can only be set if the timer is paused or hasn't started yet.`;
    else if (state === TimerStates.PAUSED && duration <= totalElapsedTime)
      message = `Duration (${duration}ms) must be greater than total elapsed time (${totalElapsedTime}ms)`;

    if (message) throw new EPP({ message, code: "INVALID_DURATION_OR_STATE" });
  }

  setDuration(durationMs: number) {
    try {
      this.#assertDurationIsValidAndCanBeSet({
        duration: durationMs,
        state: this.#data.state,
        totalElapsedTime: this.elapsedTime.total,
      });
    } catch (ex) {
      return { success: false, message: ex.message };
    }

    const previousDuration = this.duration;
    this.#data.duration = durationMs;

    {
      const eventArgument = { ...this.#getEventArgument(), previousDuration };
      this.emit("duration_change", eventArgument);
    }

    return {
      success: true,
      message: `Changed duration from ${previousDuration}ms to ${durationMs}ms.`,
    };
  }

  get state() {
    return TimerStates[this.#data.state];
  }

  get elapsedTime() {
    return { ...this.#data.elapsedTime };
  }

  get remainingTime() {
    return this.#data.duration - this.#data.elapsedTime.total;
  }

  get duration() {
    return this.#data.duration;
  }

  get timeInfo() {
    return {
      duration: this.duration,
      elapsedTime: this.elapsedTime,
      remainingTime: this.remainingTime,
    };
  }

  get logs(): TimerEventLog[] {
    return [...this.#data.logs];
  }

  get ref(): RefType | null {
    const ref = this.#data.ref;
    return ref ? { ...ref } : null;
  }

  get info() {
    return {
      ref: this.ref,
      logs: this.logs,
      state: this.state,
      ...this.timeInfo,
    };
  }
}
