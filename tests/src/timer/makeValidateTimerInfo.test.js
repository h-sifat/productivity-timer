const makeValidateTimerInfo = require("../../../src/timer/makeValidateTimerInfo");

const convertToMilliSeconds = ({ duration, unit }) => {
  if (unit !== "second")
    throw Error(
      `No duration unit ("${unit}") other than "second" should be passed to the mock convertToMilliSeconds function.`
    );
  return duration * 1000;
};

const TIMER_CONSTANTS = {
  MAX_NAME_LENGTH: 5,
  MIN_DURATION_MS: 2 * 1000,
  MAX_DURATION_MS: 10 * 1000,
  MAX_DESCRIPTION_LENGTH: 10,
  VALID_DURATION_UNITS: Object.freeze(["hour", "second", "minute"]),
  DURATION_UNIT_ALIASES: Object.freeze({ h: "hour", s: "second", m: "minute" }),
};

const {
  MIN_DURATION_MS,
  MAX_DURATION_MS,
  MAX_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} = TIMER_CONSTANTS;

const VALID_TIMER_ARG = Object.freeze({
  unit: "s", // don't change the unit value otherwise the mock convertToMilliSeconds function will break
  duration: MAX_DURATION_MS / 1000 - 1, // 9s
  name: "a".repeat(MAX_NAME_LENGTH - 1),
  description: "a".repeat(MAX_DESCRIPTION_LENGTH - 1),
});

const validateTimerInfo = makeValidateTimerInfo({
  TIMER_CONSTANTS,
  convertToMilliSeconds,
});

describe("Validation", () => {
  it.each([
    {
      timerInfo: {},
      errorCode: "MISSING_PROPERTY",
      case: "required property is missing",
    },
    {
      timerInfo: { ...VALID_TIMER_ARG, name: undefined },
      errorCode: "MISSING_PROPERTY",
      case: "required property is missing",
    },
    {
      timerInfo: { ...VALID_TIMER_ARG, duration: undefined },
      errorCode: "MISSING_PROPERTY",
      case: "required property is missing",
    },

    {
      errorCode: "INVALID_NAME",
      timerInfo: { ...VALID_TIMER_ARG, name: "" },
      case: `name is not a non-empty-string that is less then ${MAX_NAME_LENGTH} chars`,
    },
    {
      errorCode: "INVALID_NAME",
      timerInfo: {
        ...VALID_TIMER_ARG,
        name: "a".repeat(MAX_NAME_LENGTH + 1),
      },
      case: `name is not a non-empty-string that is less then ${MAX_NAME_LENGTH} chars`,
    },
    {
      errorCode: "INVALID_DURATION",
      timerInfo: { ...VALID_TIMER_ARG, duration: "hello" },
      case: `duration is not an integer and not within range: {${MIN_DURATION_MS},${MAX_DURATION_MS}}`,
    },
    {
      errorCode: "INVALID_DURATION",
      timerInfo: { ...VALID_TIMER_ARG, duration: 23.23 },
      case: `duration is not an integer and not within range: {${MIN_DURATION_MS},${MAX_DURATION_MS}}`,
    },
    {
      errorCode: "INVALID_DURATION",
      timerInfo: { ...VALID_TIMER_ARG, duration: MIN_DURATION_MS - 1 },
      case: `duration is not an integer and not within range: {${MIN_DURATION_MS},${MAX_DURATION_MS}}`,
    },
    {
      errorCode: "INVALID_DURATION",
      timerInfo: { ...VALID_TIMER_ARG, duration: MAX_DURATION_MS + 1 },
      case: `duration is not an integer and not within range: {${MIN_DURATION_MS},${MAX_DURATION_MS}}`,
    },
    {
      errorCode: "INVALID_DESCRIPTION",
      timerInfo: {
        ...VALID_TIMER_ARG,
        description: "a".repeat(MAX_DESCRIPTION_LENGTH + 1),
      },
      case: `duration is longer than ${MAX_DESCRIPTION_LENGTH} characters`,
    },
    {
      errorCode: "MISSING_PROPERTY",
      timerInfo: { ...VALID_TIMER_ARG, unit: undefined },
      case: `unit property is missing`,
    },
    {
      errorCode: "INVALID_TIME_UNIT",
      timerInfo: { ...VALID_TIMER_ARG, unit: "not_valid_unit" },
      case: `unit is not in [${TIMER_CONSTANTS.VALID_DURATION_UNITS}]`,
    },
  ])(
    "throws error if $case || timerInfo: $timerInfo",
    ({ timerInfo, errorCode }) => {
      expect.assertions(1);
      try {
        validateTimerInfo(timerInfo);
      } catch (ex) {
        expect(ex.code).toEqual(errorCode);
      }
    }
  );
});

describe("Functionality", () => {
  it("returns timer info if everything is valid", () => {
    const { name, duration, description } = VALID_TIMER_ARG;
    expect(validateTimerInfo(VALID_TIMER_ARG)).toEqual({
      name,
      duration,
      description,
      unit: "second", // VALID_TIMER_ARG.unit = "s"
      durationMS: convertToMilliSeconds({ duration, unit: "second" }),
    });
  });
});
