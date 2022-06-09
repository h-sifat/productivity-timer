const makeValidateTimerInfo = require("../../../src/timer/makeValidateTimerInfo");

const MAX_NAME_LENGTH = 5;
const MIN_DURATION_SECONDS = 1;
const MAX_DURATION_SECONDS = 10;
const MAX_DESCRIPTION_LENGTH = 5;

const TIMER_CONSTANTS = Object.freeze({
  MAX_NAME_LENGTH,
  MIN_DURATION_SECONDS,
  MAX_DURATION_SECONDS,
  MAX_DESCRIPTION_LENGTH,
});

const VALID_TIMER_ARG = Object.freeze({
  duration: MAX_DURATION_SECONDS - 1,
  name: "a".repeat(MAX_NAME_LENGTH - 1),
  description: "a".repeat(MAX_DESCRIPTION_LENGTH - 1),
});

const required = () => {
  throw { code: "MISSING_PROPERTY" };
};
const EPP = function (message, code) {
  this.code = code;
};

const validateTimerInfo = makeValidateTimerInfo({
  EPP,
  required,
  TIMER_CONSTANTS,
});

fdescribe("Timer Constructor", () => {
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
      case: `duration is not an integer and not within range: {${MIN_DURATION_SECONDS},${MAX_DURATION_SECONDS}}`,
    },
    {
      errorCode: "INVALID_DURATION",
      timerInfo: { ...VALID_TIMER_ARG, duration: 23.23 },
      case: `duration is not an integer and not within range: {${MIN_DURATION_SECONDS},${MAX_DURATION_SECONDS}}`,
    },
    {
      errorCode: "INVALID_DURATION",
      timerInfo: { ...VALID_TIMER_ARG, duration: MIN_DURATION_SECONDS - 1 },
      case: `duration is not an integer and not within range: {${MIN_DURATION_SECONDS},${MAX_DURATION_SECONDS}}`,
    },
    {
      errorCode: "INVALID_DURATION",
      timerInfo: { ...VALID_TIMER_ARG, duration: MAX_DURATION_SECONDS + 1 },
      case: `duration is not an integer and not within range: {${MIN_DURATION_SECONDS},${MAX_DURATION_SECONDS}}`,
    },
    {
      errorCode: "INVALID_DESCRIPTION",
      timerInfo: {
        ...VALID_TIMER_ARG,
        description: "a".repeat(MAX_DESCRIPTION_LENGTH + 1),
      },
      case: `duration is longer than ${MAX_DESCRIPTION_LENGTH} characters`,
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
