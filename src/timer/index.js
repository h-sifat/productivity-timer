const {
  TIMER_STATES,
  makeTimerClass,
  TIMER_CONSTANTS,
} = require("./makeTimerClass");
const makeValidateTimerInfo = require("./makeValidateTimerInfo");
const { convertToMilliSeconds, assertNonNullObject } = require("../util");

const validateTimerInfo = makeValidateTimerInfo({
  TIMER_CONSTANTS,
  convertToMilliSeconds,
});

const Timer = makeTimerClass({ validateTimerInfo, assertNonNullObject });

module.exports = {
  Timer,
  TIMER_STATES,
  TIMER_CONSTANTS,
  validateTimerInfo,
};
