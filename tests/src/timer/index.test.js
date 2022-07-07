const { TIMER_STATES, TIMER_CONSTANTS, Timer } = require("../../../src/timer");
const { MIN_DURATION_MS, MS_IN_ONE_SECOND } = TIMER_CONSTANTS;

const TIMER_NAME = "name";
const DURATION_UNIT = "s";
const TIMER_DESCRIPTION = "desc";
const TIMER_DURATION_SEC = MIN_DURATION_MS / MS_IN_ONE_SECOND;
const TIMER_DURATION_MS = MIN_DURATION_MS;
const FAILED_RESULT = Object.freeze({ success: false });

const VALID_TIMER_ARG = Object.freeze({
  name: TIMER_NAME,
  callback: () => {},
  unit: DURATION_UNIT,
  duration: TIMER_DURATION_SEC,
  description: TIMER_DESCRIPTION,
});

let globalTestTimer;

beforeEach(() => {
  globalTestTimer = new Timer(VALID_TIMER_ARG);
});

afterEach(() => {
  globalTestTimer.reset();
});

describe("timer.info", () => {
  it('returns state "NOT_STARTED" for new timers', () => {
    expect(globalTestTimer.info()).toEqual({
      elapsedTimeMS: 0,
      name: TIMER_NAME,
      unit: DURATION_UNIT,
      events: expect.any(Array),
      duration: TIMER_DURATION_SEC,
      durationMS: TIMER_DURATION_MS,
      description: TIMER_DESCRIPTION,
      remainingTimeMS: TIMER_DURATION_MS,
      state: TIMER_STATES[TIMER_STATES.NOT_STARTED],
    });
  });

  it("returns brief timerInfo if the brief option is true", () => {
    expect(globalTestTimer.info({ brief: true })).toEqual({
      name: TIMER_NAME,
      unit: DURATION_UNIT,
      duration: TIMER_DURATION_SEC,
      description: TIMER_DESCRIPTION,
    });
  });
});

describe("Timer Constructor", () => {
  it.each([
    {
      arg: "not_object",
      errorCode: "ARG_NOT_OBJECT",
      case: "arg is not an object",
    },
    {
      arg: null,
      errorCode: "ARG_NOT_OBJECT",
      case: "arg is not an object",
    },
    {
      arg: {},
      errorCode: "MISSING_PROPERTY",
      case: "required property is missing",
    },
    {
      arg: { ...VALID_TIMER_ARG, callback: "not a function" },
      errorCode: "INVALID_CALLBACK",
      case: "duration is not a function",
    },
  ])("throws error if $case || arg: $arg", ({ arg, errorCode }) => {
    expect.assertions(1);
    try {
      new Timer(arg);
    } catch (ex) {
      expect(ex.code).toEqual(errorCode);
    }
  });
});

describe("Timer.start", () => {
  it(`returns {success: true, message: string} if called on a new timer`, () => {
    {
      const { success, message } = globalTestTimer.start();
      expect(success).toBeTruthy();
      expect(message).toMatch(/started/i);
    }

    const timerInfo = globalTestTimer.info();
    expect(timerInfo).toMatchObject({
      state: TIMER_STATES[TIMER_STATES.RUNNING],
    });
  });

  it(`returns ${JSON.stringify(
    FAILED_RESULT
  )} is the timer is already running`, () => {
    // first call
    globalTestTimer.start();

    // second call
    expect(globalTestTimer.start()).toEqual({
      success: false,
      message: expect.any(String),
    });
  });

  it("calls the callback with timerInfo when the time is up", (done) => {
    const callback = (data) => {
      try {
        expect(data).toEqual({
          name: TIMER_NAME,
          remainingTimeMS: 0,
          unit: DURATION_UNIT,
          events: expect.any(Array),
          duration: TIMER_DURATION_SEC,
          durationMS: TIMER_DURATION_MS,
          description: TIMER_DESCRIPTION,
          elapsedTimeMS: TIMER_DURATION_MS,
          state: TIMER_STATES[TIMER_STATES.TIMED_UP],
        });

        expect(data.events).toHaveLength(2); // start, time_up

        const [startEvent, time_upEvent] = data.events;

        expect(startEvent).toEqual({ name: "start", time: expect.any(Number) });
        expect(time_upEvent).toEqual({
          name: "time_up",
          time: expect.any(Number),
        });

        done();
      } catch (ex) {
        done(ex);
      }
    };

    const TIMER_WITH_CUSTOM_CALLBACK = new Timer({
      ...VALID_TIMER_ARG,
      callback,
    });

    TIMER_WITH_CUSTOM_CALLBACK.start();
  });

  it("starts a paused timer", () => {
    globalTestTimer.start();
    globalTestTimer.pause();

    // after pause
    {
      const timerInfo = globalTestTimer.info();
      expect(timerInfo).toMatchObject({
        state: TIMER_STATES[TIMER_STATES.PAUSED],
      });

      expect(timerInfo.events).toHaveLength(2); // start, pause
      expect(timerInfo.events.pop()).toMatchObject({ name: "pause" });
    }

    {
      const { success, message } = globalTestTimer.start();
      expect(success).toBeTruthy();
      expect(message).toMatch(/resumed/i);
    }

    // resume after pause
    {
      const timerInfo = globalTestTimer.info();
      expect(timerInfo).toMatchObject({
        state: TIMER_STATES[TIMER_STATES.RUNNING],
      });
      expect(timerInfo.events).toHaveLength(3); // start, pause, start
      expect(timerInfo.events.pop()).toMatchObject({ name: "resume" });
    }
  });
});

describe("Timer.pause", () => {
  it(`returns {success: false, message: string} if timer is not running`, () => {
    expect(globalTestTimer.pause()).toEqual({
      success: false,
      message: expect.any(String),
    });
  });

  it(`returns "{success: true, message: string}" if the timer is running`, () => {
    globalTestTimer.start();

    // before
    {
      const timerInfo = globalTestTimer.info();
      expect(timerInfo).toMatchObject({
        state: TIMER_STATES[TIMER_STATES.RUNNING],
      });
      expect(timerInfo.events).toHaveLength(1); // start
    }

    expect(globalTestTimer.pause()).toEqual({
      success: true,
      message: expect.any(String),
    });

    // after
    {
      const timerInfo = globalTestTimer.info();
      expect(timerInfo).toMatchObject({
        state: TIMER_STATES[TIMER_STATES.PAUSED],
      });

      expect(timerInfo.events).toHaveLength(2); // start, pause
      expect(timerInfo.events.pop()).toMatchObject({ name: "pause" });
    }
  });
});

describe("Timer.end()", () => {
  it("cannot be called on NOT_STARTED state", async () => {
    // the globalTestTimer currently in NOT_STARTED state

    expect(await globalTestTimer.end()).toEqual({
      success: false,
      message: expect.any(String),
    });
  });
  it("cannot be called on TIMED_UP state", (done) => {
    let localTestTimer;

    const callback = async () => {
      try {
        expect(await localTestTimer.end()).toEqual({
          success: false,
          message: expect.any(String),
        });
        done();
      } catch (ex) {
        done(ex);
      }
    };

    localTestTimer = new Timer({ ...VALID_TIMER_ARG, callback });
    localTestTimer.start();
  });

  it("cannot be called on ENDED state", async () => {
    globalTestTimer.start();

    {
      const { success, message } = await globalTestTimer.end();
      expect(success).toBeTruthy();
      expect(message).toMatch(/ended/i);
    }

    // now the timer is in ENDED sate
    expect(await globalTestTimer.end()).toEqual({
      success: false,
      message: expect.any(String),
    });
  });

  it("calls the callback with timerInfo after ending a timer", (done) => {
    let localTestTimer;

    const callback = (data) => {
      try {
        expect(data).toMatchObject({
          name: TIMER_NAME,
          unit: DURATION_UNIT,
          events: expect.any(Array),
          duration: TIMER_DURATION_SEC,
          durationMS: TIMER_DURATION_MS,
          description: TIMER_DESCRIPTION,
          elapsedTimeMS: expect.any(Number),
          remainingTimeMS: expect.any(Number),
          state: TIMER_STATES[TIMER_STATES.ENDED],
        });

        expect(data.events).toHaveLength(2); // start, time_up

        const [startEvent, endEvent] = data.events;

        expect(startEvent).toEqual({ name: "start", time: expect.any(Number) });
        expect(endEvent).toEqual({
          name: "end",
          time: expect.any(Number),
        });
        done();
      } catch (ex) {
        done(ex);
      }
    };

    localTestTimer = new Timer({ ...VALID_TIMER_ARG, callback });
    localTestTimer.start();
    localTestTimer.end();
  });
});
