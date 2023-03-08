import CountDownTimer, {
  DEFAULT_TIMER_DURATION,
  TimerStates,
} from "src/countdown-timer/timer";
import createFakeIntervalTimer from "fixtures/countdown-timer/interval-timer";
import getSeries from "fixtures/countdown-timer/other";
import EPP from "common/util/epp";

const {
  allFakeTimers,
  fakeSetInterval,
  fakeClearInterval,
  clearAllFakeTimers,
  getCurrentFakeTimerId,
  manualTick: fakeManualTick,
} = createFakeIntervalTimer();

const TICK_INTERVAL_MS = 1000;
const defaultFakeTimestamp = Date.now();
const defaultFakeDateFromTimeMsValue = new Date(
  defaultFakeTimestamp
).toLocaleDateString();
const MAX_ALLOWED_TICK_DIFF_MS = TICK_INTERVAL_MS * 2;
const fakeCurrentTimeMs = jest.fn().mockReturnValue(defaultFakeTimestamp);
const fakeGetDateFromTimeMs = jest
  .fn()
  .mockReturnValue(defaultFakeDateFromTimeMsValue);

function configureFakeCurrentTimeMsForChangingTimestamps(
  arg: { incrementBy?: number } = {}
) {
  const { incrementBy = TICK_INTERVAL_MS } = arg;
  const series = getSeries({ incrementBy });

  fakeCurrentTimeMs.mockReset();
  fakeCurrentTimeMs.mockImplementation(() => series.next());
}

const assertValidRef = jest.fn();
const VALID_CONSTRUCTOR_ARGUMENT = Object.freeze({
  assertValidRef,
  TICK_INTERVAL_MS,
  MAX_ALLOWED_TICK_DIFF_MS,
  setInterval: fakeSetInterval,
  clearInterval: fakeClearInterval,
  currentTimeMs: fakeCurrentTimeMs,
  getDateFromTimeMs: fakeGetDateFromTimeMs,
});

const timer = new CountDownTimer(VALID_CONSTRUCTOR_ARGUMENT);

const INITIAL_TIMER_INFO = Object.freeze({
  logs: Object.freeze([]),
  ref: null,
  duration: DEFAULT_TIMER_DURATION,
  elapsedTime: Object.freeze({ total: 0, byDate: {} }),
  remainingTime: DEFAULT_TIMER_DURATION,
  state: TimerStates[TimerStates.NOT_STARTED],
});

beforeEach(() => {
  assertValidRef.mockReset();

  clearAllFakeTimers();

  fakeCurrentTimeMs.mockReset();
  fakeGetDateFromTimeMs.mockReset();

  fakeCurrentTimeMs.mockReturnValue(defaultFakeTimestamp);
  fakeGetDateFromTimeMs.mockReturnValue(defaultFakeDateFromTimeMsValue);

  timer.removeAllListeners();
  timer.reset();
});

describe("get info()", () => {
  it(`returns initial state if timer hasn't started yet`, () => {
    expect(timer.info).toEqual(INITIAL_TIMER_INFO);
  });
});

describe("Timer.pause()", () => {
  it(`can't pause a timer if it's not running`, () => {
    const result = timer.pause();
    expect(result).toEqual({ success: false, message: expect.any(String) });
  });

  it(`pauses a running timer and emits a "pause" event`, (done) => {
    timer.on("pause", (arg) => {
      try {
        expect(arg).toEqual({
          ref: null,
          duration: DEFAULT_TIMER_DURATION,
          elapsedTime: { total: 0, byDate: {} },
          remainingTime: DEFAULT_TIMER_DURATION,
          state: TimerStates[TimerStates.PAUSED],
        });
        done();
      } catch (ex) {
        done(ex);
      }
    });

    timer.start();
    expect(timer.state).toBe(TimerStates[TimerStates.RUNNING]);

    timer.pause();
    expect(timer.state).toBe(TimerStates[TimerStates.PAUSED]);

    const logs = timer.logs;
    expect(logs).toHaveLength(2);

    expect(logs[1]).toEqual({ name: "pause", timestamp: defaultFakeTimestamp });
  });
});

describe("Timer.start()", () => {
  it(`it starts a timer and emits the "start" event`, (done) => {
    timer.on("start", (arg) => {
      try {
        expect(arg).toEqual({
          ref: null,
          duration: DEFAULT_TIMER_DURATION,
          elapsedTime: { total: 0, byDate: {} },
          remainingTime: DEFAULT_TIMER_DURATION,
          state: TimerStates[TimerStates.RUNNING],
        });
        done();
      } catch (ex) {
        done(ex);
      }
    });

    const result = timer.start();

    expect(result).toEqual({ success: true, message: expect.any(String) });
    expect(timer.state).toBe(TimerStates[TimerStates.RUNNING]);
    expect(timer.logs).toEqual([
      { name: "start", timestamp: defaultFakeTimestamp },
    ]);

    expect(allFakeTimers).toHaveProperty(getCurrentFakeTimerId());

    // as the timer has started, the setInterval should have been called
    expect(allFakeTimers[getCurrentFakeTimerId()]).toEqual({
      interval: TICK_INTERVAL_MS,
      callback: expect.any(Function),
    });
  });

  it(`starts a paused timer`, () => {
    timer.start();

    timer.pause();
    expect(timer.state).toBe(TimerStates[TimerStates.PAUSED]);

    timer.start();
    expect(timer.state).toBe(TimerStates[TimerStates.RUNNING]);
  });

  it(`doesn't start a manually ended timer`, () => {
    timer.start();

    timer.end();
    expect(timer.state).toBe(TimerStates[TimerStates.ENDED]);

    const result = timer.start();

    expect(result).toEqual({ success: false, message: expect.any(String) });
    expect(timer.state).toBe(TimerStates[TimerStates.ENDED]);
  });

  it(`doesn't start a timer if the current time is less than the last event timestamp`, () => {
    fakeCurrentTimeMs.mockClear();

    fakeCurrentTimeMs.mockReturnValue(defaultFakeTimestamp);

    expect(timer.start()).toMatchObject({ success: true });
    expect(timer.pause()).toMatchObject({ success: true });

    // returning timestamp less than the previous "start" and "pause" event
    fakeCurrentTimeMs.mockReturnValue(defaultFakeTimestamp - TICK_INTERVAL_MS);

    {
      const result = timer.start();
      expect(result).toMatchObject({ success: false });
    }
  });
});

describe("Handling Abnormal Time Changes", () => {
  {
    const testMessage = `emits the "err:time_decrement" event and pauses the timer if currentTimeMs() returns value less than the last tick`;

    it(testMessage, (done) => {
      // configuring the fake currentTimeMs function so that it returns
      // decreasing timestamps
      configureFakeCurrentTimeMsForChangingTimestamps({
        incrementBy: -TICK_INTERVAL_MS,
      });

      timer.on("err:time_decrement", (arg) => {
        try {
          expect(arg.state).toBe(TimerStates[TimerStates.PAUSED]);
          expect(timer.logs.pop()).toEqual({
            name: "pause",
            timestamp: expect.any(Number),
          });
          done();
        } catch (ex) {
          done(ex);
        }
      });

      const { success } = timer.start();
      expect(success).toBeTruthy();

      // calling the interval callback so the tick event will be fired
      fakeManualTick(getCurrentFakeTimerId()); // first tick
      fakeManualTick(getCurrentFakeTimerId()); // second tick
      // boOM! you've decremented the time or date of your machine and my program
      // is smart enough to notice that.
    });
  }

  it(`emits the "err:wake_up_or_time_increment" if computer wakes up from sleep or the time or date is incremented`, (done) => {
    // configuring the fake currentTimeMs function so that it returns
    // increasing (by 2 * MAX_ALLOWED_TICK_DIFF_MS) timestamps
    configureFakeCurrentTimeMsForChangingTimestamps({
      incrementBy: MAX_ALLOWED_TICK_DIFF_MS * 2,
    });

    timer.on("err:wake_up_or_time_increment", (arg) => {
      try {
        expect(arg.state).toBe(TimerStates[TimerStates.PAUSED]);
        expect(timer.logs.pop()).toEqual({
          name: "pause",
          timestamp: expect.any(Number),
        });
        done();
      } catch (ex) {
        done(ex);
      }
    });

    const { success } = timer.start();
    expect(success).toBeTruthy();

    // calling the interval callback so the tick event will be fired
    fakeManualTick(getCurrentFakeTimerId()); // first tick
    fakeManualTick(getCurrentFakeTimerId()); // second tick
    // your computer probably just resumed from sleep or you've incremented
    // the time or date
  });
});

describe("Events", () => {
  it(`emits a tick event on every tick`, (done) => {
    timer.on("tick", (arg) => {
      try {
        const { state, duration, remainingTime } = arg;
        expect(state).toBe(TimerStates[TimerStates.RUNNING]);
        expect(duration - remainingTime).toBe(TICK_INTERVAL_MS);
        done();
      } catch (ex) {
        done(ex);
      }
    });

    configureFakeCurrentTimeMsForChangingTimestamps();

    expect(timer.start()).toEqual({
      success: true,
      message: expect.any(String),
    });

    // calling the interval callback so the tick event will be fired
    fakeManualTick(getCurrentFakeTimerId()); // first tick
  });

  it(`emits a "time_up" event  on time up`, (done) => {
    configureFakeCurrentTimeMsForChangingTimestamps();

    timer.setDuration({ duration: TICK_INTERVAL_MS });

    timer.on("time_up", (arg) => {
      try {
        const { remainingTime, elapsedTime, duration, state } = arg;

        expect(state).toBe(TimerStates[TimerStates.TIMED_UP]);
        expect(remainingTime).toBe(0);
        expect(elapsedTime.total).toBe(duration);

        {
          let totalElapsedTimeByDate = 0;
          Object.values(elapsedTime.byDate).forEach(
            (time) => (totalElapsedTimeByDate += <number>time)
          );
          expect(totalElapsedTimeByDate).toBe(duration);
        }

        const lastEventLog = timer.logs.pop()!;
        expect(lastEventLog).toEqual({
          name: "time_up",
          timestamp: expect.any(Number),
        });

        done();
      } catch (ex) {
        done(ex);
      }
    });

    timer.start();

    fakeManualTick(getCurrentFakeTimerId()); // tick
    // and time up.
  });
});

describe("setDuration()", () => {
  const allChangeTypes = Object.freeze([
    "absolute",
    "increment",
    "decrement",
  ] as const);

  it.each([
    { duration: 2423.23423, case: "not a positive integer" },
    {
      duration: TICK_INTERVAL_MS + 1,
      case: `not a multiple of TICK_INTERVAL_MS: ${TICK_INTERVAL_MS}`,
    },
  ])(`doesn't set the duration ($duration) if $case`, ({ duration }) => {
    for (const changeType of allChangeTypes)
      expect(timer.setDuration({ duration, changeType })).toEqual({
        success: false,
        message: expect.any(String),
      });
  });

  it.each([
    {
      changeType: "absolute",
      duration: TICK_INTERVAL_MS,
      result: TICK_INTERVAL_MS,
    },
    {
      changeType: "increment",
      duration: TICK_INTERVAL_MS,
      result: timer.duration + TICK_INTERVAL_MS,
    },
    {
      changeType: "decrement",
      duration: TICK_INTERVAL_MS,
      result: timer.duration - TICK_INTERVAL_MS,
    },
  ] as const)(
    `sets the duration if timer hasn't started yet and changeType = "$changeType"`,
    ({ changeType, duration, result }) => {
      expect(timer.state).toBe(TimerStates[TimerStates.NOT_STARTED]);

      expect(timer.setDuration({ duration, changeType })).toEqual({
        success: true,
        message: expect.any(String),
      });

      expect(timer.duration).toBe(result);
    }
  );

  it(`doesn't set the duration if the timer is running`, () => {
    timer.start();
    expect(timer.state).toBe(TimerStates[TimerStates.RUNNING]);

    for (const changeType of allChangeTypes) {
      const result = timer.setDuration({
        duration: TICK_INTERVAL_MS * 1000,
        changeType,
      });

      expect(result).toEqual({
        success: false,
        message: expect.any(String),
      });
    }
  });

  it(`doesn't set the duration if the timer has been ended manually`, () => {
    timer.start();
    expect(timer.state).toBe(TimerStates[TimerStates.RUNNING]);
    timer.end();
    expect(timer.state).toBe(TimerStates[TimerStates.ENDED]);

    for (const changeType of allChangeTypes) {
      const result = timer.setDuration({
        duration: TICK_INTERVAL_MS * 1000,
        changeType,
      });

      expect(result).toEqual({
        success: false,
        message: expect.any(String),
      });
    }
  });

  it(`doesn't set the duration of a timer that has timed up`, () => {
    timer.setDuration({ duration: TICK_INTERVAL_MS });
    expect(timer.duration).toBe(TICK_INTERVAL_MS);

    configureFakeCurrentTimeMsForChangingTimestamps();

    expect(timer.start()).toMatchObject({ success: true });
    fakeManualTick(getCurrentFakeTimerId()); // tick

    expect(timer.state).toBe(TimerStates[TimerStates.TIMED_UP]);

    for (const changeType of allChangeTypes) {
      const result = timer.setDuration({
        duration: TICK_INTERVAL_MS * 1000,
        changeType,
      });
      expect(result).toEqual({ success: false, message: expect.any(String) });
    }
  });

  it(`doesn't set the duration if timer paused and the new duration is <= elapsedTime`, () => {
    configureFakeCurrentTimeMsForChangingTimestamps();

    expect(timer.start()).toMatchObject({ success: true });
    fakeManualTick(getCurrentFakeTimerId()); // tick
    fakeManualTick(getCurrentFakeTimerId()); // tick
    expect(timer.pause()).toMatchObject({ success: true });

    expect(timer.elapsedTime.total).toBe(2 * TICK_INTERVAL_MS);

    {
      // new duration < totalElapsedTime
      const result = timer.setDuration({
        duration: timer.elapsedTime.total - TICK_INTERVAL_MS,
        changeType: "absolute",
      });
      expect(result).toEqual({ success: false, message: expect.any(String) });
    }

    {
      // new duration = totalElapsedTime
      const result = timer.setDuration({ duration: timer.elapsedTime.total });
      expect(result).toEqual({ success: false, message: expect.any(String) });
    }

    {
      // new duration > totalElapsedTime
      const result = timer.setDuration({
        duration: timer.elapsedTime.total + TICK_INTERVAL_MS,
      });
      expect(result).toEqual({ success: true, message: expect.any(String) });
    }

    // start the timer again
    {
      const result = timer.start();
      expect(result).toEqual({ success: true, message: expect.any(String) });
    }

    expect(timer.state).toBe(TimerStates[TimerStates.RUNNING]);

    fakeManualTick(getCurrentFakeTimerId()); // tick

    expect(timer.state).toBe(TimerStates[TimerStates.TIMED_UP]);
  });

  it(`emits a "duration_change" event if the duration changes`, (done) => {
    const previousDuration = timer.duration;
    const newDuration = TICK_INTERVAL_MS;

    timer.on("duration_change", (arg) => {
      try {
        expect(arg).toMatchObject({
          previousDuration,
          duration: newDuration,
        });
        done();
      } catch (ex) {
        done(ex);
      }
    });

    {
      // new duration = totalElapsedTime
      const result = timer.setDuration({ duration: newDuration });
      expect(result).toEqual({ success: true, message: expect.any(String) });
    }
  });
});

describe("Timer.end()", () => {
  it(`doesn't end a timer if timer hasn't started yet`, () => {
    expect(timer.state).toBe(TimerStates[TimerStates.NOT_STARTED]);
    {
      const result = timer.end();
      expect(result).toEqual({ success: false, message: expect.any(String) });
    }
  });

  it(`ends a timer if it's running and emits a "end_manually" event`, (done) => {
    timer.on("end_manually", (arg) => {
      try {
        expect(arg.state).toBe(TimerStates[TimerStates.ENDED]);

        done();
      } catch (ex) {
        done(ex);
      }
    });

    {
      const result = timer.start();
      expect(result).toEqual({ success: true, message: expect.any(String) });

      expect(timer.state).toBe(TimerStates[TimerStates.RUNNING]);
    }

    expect(allFakeTimers[getCurrentFakeTimerId()]).toBeDefined();

    {
      const result = timer.end();
      expect(result).toEqual({ success: true, message: expect.any(String) });

      expect(timer.state).toBe(TimerStates[TimerStates.ENDED]);
    }

    expect(allFakeTimers[getCurrentFakeTimerId()]).not.toBeDefined();

    expect(timer.logs).toHaveLength(2);

    // the last log
    expect(timer.logs.pop()).toEqual({
      name: "end_manually",
      timestamp: expect.any(Number),
    });
  });

  it(`ends a timer if it's paused and emits a "end_manually" event`, (done) => {
    timer.on("end_manually", (arg) => {
      try {
        expect(arg.state).toBe(TimerStates[TimerStates.ENDED]);

        done();
      } catch (ex) {
        done(ex);
      }
    });

    {
      const result = timer.start();
      expect(result).toEqual({ success: true, message: expect.any(String) });

      expect(timer.state).toBe(TimerStates[TimerStates.RUNNING]);
      expect(allFakeTimers[getCurrentFakeTimerId()]).toBeDefined();
    }

    {
      const result = timer.pause();
      expect(result).toEqual({ success: true, message: expect.any(String) });

      expect(timer.state).toBe(TimerStates[TimerStates.PAUSED]);
    }

    {
      const result = timer.end();
      expect(result).toEqual({ success: true, message: expect.any(String) });

      expect(timer.state).toBe(TimerStates[TimerStates.ENDED]);
    }

    expect(allFakeTimers[getCurrentFakeTimerId()]).not.toBeDefined();

    expect(timer.logs).toHaveLength(3);

    // the last log
    expect(timer.logs.pop()).toEqual({
      name: "end_manually",
      timestamp: expect.any(Number),
    });
  });

  it(`doesn't end a timer that has already been ended`, () => {
    timer.start();
    expect(timer.state).toBe(TimerStates[TimerStates.RUNNING]);

    timer.end();
    expect(timer.state).toBe(TimerStates[TimerStates.ENDED]);

    expect(timer.logs).toHaveLength(2);

    {
      const result = timer.end();
      expect(result).toEqual({ success: false, message: expect.any(String) });
    }

    expect(timer.logs).toHaveLength(2);
  });

  it(`doesn't end a timer that has been timed up`, () => {
    configureFakeCurrentTimeMsForChangingTimestamps();

    timer.setDuration({ duration: TICK_INTERVAL_MS });
    timer.start();

    fakeManualTick(getCurrentFakeTimerId()); // tick

    expect(timer.state).toBe(TimerStates[TimerStates.TIMED_UP]);

    {
      const result = timer.end();
      expect(result).toEqual({ success: false, message: expect.any(String) });
    }
  });
});

describe("Timer.reset()", () => {
  it(`resets a timer to it's initial state and emits a "reset" event`, (done) => {
    configureFakeCurrentTimeMsForChangingTimestamps();

    timer.start();
    expect(timer.state).toBe(TimerStates[TimerStates.RUNNING]);

    fakeManualTick(getCurrentFakeTimerId()); // tick

    const timerInfoBeforeReset = timer.info;

    timer.on("reset", (arg) => {
      try {
        expect(arg).toEqual({
          current: timer.info,
          previous: timerInfoBeforeReset,
        });
        done();
      } catch (ex) {
        done(ex);
      }
    });

    {
      const result = timer.reset();
      expect(result).toEqual({ success: true, message: expect.any(String) });
    }

    expect(timer.state).toBe(TimerStates[TimerStates.NOT_STARTED]);
    expect(allFakeTimers[getCurrentFakeTimerId()]).not.toBeDefined();
  });

  it(`sets the "duration" if provided and is valid`, () => {
    const newDuration = timer.duration + TICK_INTERVAL_MS;

    timer.start();
    expect(timer.state).toBe(TimerStates[TimerStates.RUNNING]);

    {
      const result = timer.reset({ duration: newDuration });
      expect(result).toEqual({ success: true, message: expect.any(String) });
    }

    expect(timer.info).toMatchObject({
      duration: newDuration,
      state: TimerStates[TimerStates.NOT_STARTED],
    });
  });

  it(`doesn't set the duration if it's invalid`, () => {
    const result = timer.reset({ duration: -TICK_INTERVAL_MS });
    expect(result).toEqual({ success: false, message: expect.any(String) });
  });

  it(`sets the "ref" if provided and is valid`, () => {
    const newRef = { id: "1", type: "project" } as const;
    expect(timer.ref).not.toEqual(newRef);

    {
      const result = timer.reset({ ref: newRef });
      expect(result).toEqual({ success: true, message: expect.any(String) });
    }

    expect(timer.ref).toEqual(newRef);
  });
});

it(`doesn't set the ref if it's invalid`, () => {
  assertValidRef.mockImplementationOnce(() => {
    throw new EPP(`Invalid ref.`, "INITIAL_TIMER_REF");
  });

  const result = timer.reset({ ref: "quack,quack,QuaCK" });

  expect(result).toEqual({ success: false, message: expect.any(String) });
});

describe("Constructor_Argument Validation", () => {
  it.each([
    {
      errorCode: "INVALID_TICK_INTERVAL_MS",
      case: "The TICK_INTERVAL_MS is not a positive integer",
      arg: { ...VALID_CONSTRUCTOR_ARGUMENT, TICK_INTERVAL_MS: 23423.23423 },
    },
    {
      errorCode: "INVALID_MIN_ALLOWED_TICK_DIFF_MS",
      case: "The MIN_ALLOWED_TICK_DIFF_MS is not a positive integer",
      arg: {
        ...VALID_CONSTRUCTOR_ARGUMENT,
        MIN_ALLOWED_TICK_DIFF_MS: 312.423412,
      },
    },
    {
      errorCode: "INVALID_MIN_ALLOWED_TICK_DIFF_MS",
      case: "The MIN_ALLOWED_TICK_DIFF_MS is greater than TICK_INTERVAL_MS",
      arg: {
        ...VALID_CONSTRUCTOR_ARGUMENT,
        MIN_ALLOWED_TICK_DIFF_MS:
          VALID_CONSTRUCTOR_ARGUMENT.TICK_INTERVAL_MS + 1,
      },
    },
    {
      errorCode: "INVALID_MIN_ALLOWED_TICK_DIFF_MS",
      case: "The MIN_ALLOWED_TICK_DIFF_MS is equal to TICK_INTERVAL_MS",
      arg: {
        ...VALID_CONSTRUCTOR_ARGUMENT,
        MIN_ALLOWED_TICK_DIFF_MS: VALID_CONSTRUCTOR_ARGUMENT.TICK_INTERVAL_MS,
      },
    },
    {
      errorCode: "INVALID_MAX_ALLOWED_TICK_DIFF_MS",
      case: "The MAX_ALLOWED_TICK_DIFF_MS is less than the TICK_INTERVAL_MS",
      arg: {
        ...VALID_CONSTRUCTOR_ARGUMENT,
        MAX_ALLOWED_TICK_DIFF_MS:
          VALID_CONSTRUCTOR_ARGUMENT.TICK_INTERVAL_MS - 1,
      },
    },
    {
      errorCode: "INVALID_MAX_ALLOWED_TICK_DIFF_MS",
      case: "The MAX_ALLOWED_TICK_DIFF_MS is equal to the TICK_INTERVAL_MS",
      arg: {
        ...VALID_CONSTRUCTOR_ARGUMENT,
        MAX_ALLOWED_TICK_DIFF_MS: VALID_CONSTRUCTOR_ARGUMENT.TICK_INTERVAL_MS,
      },
    },
  ])(`throws ewc "$errorCode" if $case`, ({ arg, errorCode }) => {
    expect(() => {
      // @ts-ignore
      new CountDownTimer(arg);
    }).toThrowErrorWithCode(errorCode);
  });
});

describe("Other", () => {
  it(`separates elapsed time into different dates if the date changes while the timer is running`, () => {
    const firstDate = "10/1/2022";
    const secondDate = "10/2/2022";
    const thirdDate = "10/3/2022";

    fakeGetDateFromTimeMs.mockReset();
    fakeGetDateFromTimeMs
      .mockReturnValueOnce(firstDate)
      .mockReturnValueOnce(secondDate)
      .mockReturnValueOnce(thirdDate);

    configureFakeCurrentTimeMsForChangingTimestamps();

    timer.start();

    expect(Object.keys(timer.elapsedTime.byDate)).toHaveLength(0);

    fakeManualTick(getCurrentFakeTimerId()); // first tick

    expect(timer.elapsedTime.byDate).toHaveProperty(
      firstDate,
      TICK_INTERVAL_MS
    );

    fakeManualTick(getCurrentFakeTimerId()); // second tick

    expect(timer.elapsedTime.byDate).toHaveProperty(
      secondDate,
      TICK_INTERVAL_MS
    );

    fakeManualTick(getCurrentFakeTimerId()); // third tick

    expect(timer.elapsedTime.byDate).toHaveProperty(
      thirdDate,
      TICK_INTERVAL_MS
    );
  });
});
