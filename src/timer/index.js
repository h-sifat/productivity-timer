const makeTimer = require("./makeTimer");
const makeValidateTimerInfo = require("./makeValidateTimerInfo");
const {
  EPP,
  makeEnum,
  required,
  convertToMilliSeconds,
  assertNonNullObject,
} = require("../util");

const TIMER_CONSTANTS = Object.freeze({
  MAX_NAME_LENGTH: 30,
  MS_IN_ONE_SECOND: 1000,
  MIN_DURATION_MS: 2 * 1000,
  MAX_DESCRIPTION_LENGTH: 100,
  MAX_DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
  VALID_DURATION_UNITS: Object.freeze([
    "s",
    "m",
    "h",
    "hour",
    "second",
    "minute",
  ]),
});

const TIMER_STATES = makeEnum({
  keys: ["PAUSED", "RUNNING", "TIMED_UP", "NOT_STARTED", "ENDED"],
});

const INVALID_STATE_MESSAGES = Object.freeze({
  NOT_RUNNING: "Timer is not running.",
  [TIMER_STATES.TIMED_UP]: "Timer has timed up.",
  [TIMER_STATES.RUNNING]: "Timer is already running.",
  [TIMER_STATES.ENDED]: "Timer has been ended manually.",
  [TIMER_STATES.NOT_STARTED]: "Timer has not started yet.",
});

const validateTimerInfo = makeValidateTimerInfo({
  EPP,
  required,
  TIMER_CONSTANTS,
  convertToMilliSeconds,
});

const Timer = makeTimer({
  EPP,
  required,
  TIMER_STATES,
  TIMER_CONSTANTS,
  validateTimerInfo,
  assertNonNullObject,
  INVALID_STATE_MESSAGES,
});

module.exports = {
  Timer,
  TIMER_STATES,
  TIMER_CONSTANTS,
  validateTimerInfo,
  INVALID_STATE_MESSAGES,
};
