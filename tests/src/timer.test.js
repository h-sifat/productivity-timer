const {
  Timer,
  MAX_NAME_LENGTH,
  MIN_DURATION_SECONDS,
  MAX_DURATION_SECONDS,
} = require("../../src/timer");

const TIMER_NAME = "coding";
const TIMER_DURATION_SEC = 5;
let timer;

beforeEach(() => {
  timer = new Timer({ name: TIMER_NAME, duration: TIMER_DURATION_SEC });
});

describe("timer.info", () => {
  it('returns state "NOT_STARTED" for new timers', () => {
    expect(timer.info()).toEqual({
      elapsedTime: 0,
      name: TIMER_NAME,
      state: "NOT_STARTED",
      startTime: undefined,
      duration: TIMER_DURATION_SEC,
      remainingTime: TIMER_DURATION_SEC,
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
      case: "requried property is missing",
    },
    {
      arg: { name: TIMER_NAME },
      errorCode: "MISSING_PROPERTY",
      case: "requried property is missing",
    },
    {
      arg: { duration: 23 },
      errorCode: "MISSING_PROPERTY",
      case: "requried property is missing",
    },
    {
      errorCode: "INVALID_NAME",
      arg: { name: "", duration: 20 },
      case: `name is not a non-empty-string that is less then ${MAX_NAME_LENGTH} chars`,
    },
    {
      errorCode: "INVALID_NAME",
      arg: { name: "a".repeat(MAX_NAME_LENGTH + 1), duration: 20 },
      case: `name is not a non-empty-string that is less then ${MAX_NAME_LENGTH} chars`,
    },
    {
      errorCode: "INVALID_DURATION",
      arg: { name: TIMER_NAME, duration: "hello" },
      case: `duration is not an integer and not within range: {${MIN_DURATION_SECONDS},${MAX_DURATION_SECONDS}}`,
    },
    {
      errorCode: "INVALID_DURATION",
      arg: { name: TIMER_NAME, duration: 23.23 },
      case: `duration is not an integer and not within range: {${MIN_DURATION_SECONDS},${MAX_DURATION_SECONDS}}`,
    },
    {
      errorCode: "INVALID_DURATION",
      arg: { name: TIMER_NAME, duration: MIN_DURATION_SECONDS - 1 },
      case: `duration is not an integer and not within range: {${MIN_DURATION_SECONDS},${MAX_DURATION_SECONDS}}`,
    },
    {
      errorCode: "INVALID_DURATION",
      arg: { name: TIMER_NAME, duration: MAX_DURATION_SECONDS + 1 },
      case: `duration is not an integer and not within range: {${MIN_DURATION_SECONDS},${MAX_DURATION_SECONDS}}`,
    },
  ])("throws error if $case | arg: $arg", ({ arg, errorCode }) => {
    expect.assertions(1);
    try {
      new Timer(arg);
    } catch (ex) {
      expect(ex.code).toEqual(errorCode);
    }
  });
});
