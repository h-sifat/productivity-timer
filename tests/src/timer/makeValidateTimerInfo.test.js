const {
  TIMER_CONSTANTS: TIMER_CONSTANTS_ORIGINAL,
} = require("../../../src/timer");
const makeValidateTimerInfo = require("../../../src/timer/makeValidateTimerInfo");
const { convertToMilliSeconds } = require("../../../src/util");

const TIMER_CONSTANTS = {
  ...TIMER_CONSTANTS_ORIGINAL,
  MAX_NAME_LENGTH: 5,
  MIN_DURATION_MS: 2 * 1000,
  MAX_DURATION_MS: 10 * 1000,
  MAX_DESCRIPTION_LENGTH: 10,
};

const {
  MIN_DURATION_MS,
  MAX_DURATION_MS,
  MAX_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} = TIMER_CONSTANTS;

const VALID_TIMER_ARG = Object.freeze({
  unit: "s",
  duration: MAX_DURATION_MS / 1000 - 1, // 9s
  name: "a".repeat(MAX_NAME_LENGTH - 1),
  description: "a".repeat(MAX_DESCRIPTION_LENGTH - 1),
});

const required = () => {
  throw { code: "MISSING_PROPERTY" };
};
const EPP = function (message, code) {
  this.message = message;
  this.code = code;
};

const validateTimerInfo = makeValidateTimerInfo({
  EPP,
  required,
  TIMER_CONSTANTS,
  convertToMilliSeconds,
});

describe("Timer Constructor", () => {
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

  it("returns timer info if everything is valid", () => {
    const { name, unit, duration, description } = VALID_TIMER_ARG;
    expect(validateTimerInfo(VALID_TIMER_ARG)).toEqual({
      name,
      unit,
      duration,
      description,
      durationMS: convertToMilliSeconds({ duration, unit }),
    });
  });
});
