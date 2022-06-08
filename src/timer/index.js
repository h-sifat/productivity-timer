const makeTimer = require("./makeTimer");
const { makeEnum, EPP, required } = require("../util");

const TIMER_CONSTANTS = Object.freeze({
  MAX_NAME_LENGTH: 30,
  MS_IN_ONE_SECOND: 1000,
  MIN_DURATION_SECONDS: 2,
  MAX_DURATION_SECONDS: 24 * 60 * 60, // 24 hours
  SUCCESS_RESULT: Object.freeze({ success: true }),
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

const Timer = makeTimer({
  EPP,
  required,
  TIMER_STATES,
  TIMER_CONSTANTS,
  INVALID_STATE_MESSAGES,
});

module.exports = {
  Timer,
  TIMER_STATES,
  TIMER_CONSTANTS,
  INVALID_STATE_MESSAGES,
};
