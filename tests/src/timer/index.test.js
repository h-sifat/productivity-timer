const { TIMER_STATES, TIMER_CONSTANTS, Timer } = require("../../../src/timer");

const {
  SUCCESS_RESULT,
  MAX_NAME_LENGTH,
  MS_IN_ONE_SECOND,
  MIN_DURATION_SECONDS,
  MAX_DURATION_SECONDS,
} = TIMER_CONSTANTS;

const TIMER_NAME = "coding";
const TIMER_DURATION_SEC = MIN_DURATION_SECONDS;
const FAILED_RESULT = Object.freeze({ success: false });

const VALID_TIMER_ARG = Object.freeze({
  name: TIMER_NAME,
  callback: () => {},
  duration: TIMER_DURATION_SEC,
  description: "testing",
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
      elapsedTime: 0,
      name: TIMER_NAME,
      events: expect.any(Array),
      description: expect.any(String),
      state: TIMER_STATES[TIMER_STATES.NOT_STARTED],
      duration: TIMER_DURATION_SEC * MS_IN_ONE_SECOND,
      remainingTime: TIMER_DURATION_SEC * MS_IN_ONE_SECOND,
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
      arg: { ...VALID_TIMER_ARG, name: undefined },
      errorCode: "MISSING_PROPERTY",
      case: "required property is missing",
    },
    {
      arg: { ...VALID_TIMER_ARG, duration: undefined },
      errorCode: "MISSING_PROPERTY",
      case: "required property is missing",
    },
    {
      arg: { ...VALID_TIMER_ARG, callback: undefined },
      errorCode: "MISSING_PROPERTY",
      case: "required property is missing",
    },
    {
      errorCode: "INVALID_NAME",
      arg: { ...VALID_TIMER_ARG, name: "" },
      case: `name is not a non-empty-string that is less then ${MAX_NAME_LENGTH} chars`,
    },
    {
      errorCode: "INVALID_NAME",
      arg: {
        ...VALID_TIMER_ARG,
        name: "a".repeat(MAX_NAME_LENGTH + 1),
      },
      case: `name is not a non-empty-string that is less then ${MAX_NAME_LENGTH} chars`,
    },
    {
      errorCode: "INVALID_DURATION",
      arg: { ...VALID_TIMER_ARG, duration: "hello" },
      case: `duration is not an integer and not within range: {${MIN_DURATION_SECONDS},${MAX_DURATION_SECONDS}}`,
    },
    {
      errorCode: "INVALID_DURATION",
      arg: { ...VALID_TIMER_ARG, duration: 23.23 },
      case: `duration is not an integer and not within range: {${MIN_DURATION_SECONDS},${MAX_DURATION_SECONDS}}`,
    },
    {
      errorCode: "INVALID_DURATION",
      arg: { ...VALID_TIMER_ARG, duration: MIN_DURATION_SECONDS - 1 },
      case: `duration is not an integer and not within range: {${MIN_DURATION_SECONDS},${MAX_DURATION_SECONDS}}`,
    },
    {
      errorCode: "INVALID_DURATION",
      arg: { ...VALID_TIMER_ARG, duration: MAX_DURATION_SECONDS + 1 },
      case: `duration is not an integer and not within range: {${MIN_DURATION_SECONDS},${MAX_DURATION_SECONDS}}`,
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
  it(`returns ${JSON.stringify(
    SUCCESS_RESULT
  )} if called on a new timer`, () => {
    expect(globalTestTimer.start()).toEqual(SUCCESS_RESULT);

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

  it("calls the callback when the time is up", (done) => {
    const callback = (data) => {
      try {
        expect(data).toEqual({
          remainingTime: 0,
          name: expect.any(String),
          events: expect.any(Array),
          duration: expect.any(Number),
          description: expect.any(String),
          state: TIMER_STATES[TIMER_STATES.TIMED_UP],
          elapsedTime: VALID_TIMER_ARG.duration * MS_IN_ONE_SECOND,
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

    expect(globalTestTimer.start()).toEqual(SUCCESS_RESULT);

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

  it(`returns ${JSON.stringify(
    SUCCESS_RESULT
  )} if the timer is running`, () => {
    globalTestTimer.start();

    // before
    {
      const timerInfo = globalTestTimer.info();
      expect(timerInfo).toMatchObject({
        state: TIMER_STATES[TIMER_STATES.RUNNING],
      });
      expect(timerInfo.events).toHaveLength(1); // start
    }

    expect(globalTestTimer.pause()).toEqual(SUCCESS_RESULT);

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
  it("cannot be called on NOT_STARTED state", () => {
    // the globalTestTimer currently in NOT_STARTED state

    expect(globalTestTimer.end()).toEqual({
      success: false,
      message: expect.any(String),
    });
  });
  it("cannot be called on TIMED_UP state", (done) => {
    let localTestTimer;

    const callback = () => {
      try {
        expect(localTestTimer.end()).toEqual({
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

  it("cannot be called on ENDED state", () => {
    globalTestTimer.start();

    expect(globalTestTimer.end()).toEqual(SUCCESS_RESULT);

    // now the timer is in ENDED sate
    expect(globalTestTimer.end()).toEqual({
      success: false,
      message: expect.any(String),
    });
  });

  it("calls the callback after ending a timer", (done) => {
    let localTestTimer;

    const callback = (data) => {
      try {
        expect(data).toMatchObject({
          name: expect.any(String),
          events: expect.any(Array),
          duration: expect.any(Number),
          elapsedTime: expect.any(Number),
          remainingTime: expect.any(Number),
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
