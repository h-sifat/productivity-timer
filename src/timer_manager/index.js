const { EPP } = require("../util");
const Logger = require("../logger");
const Speaker = require("../speaker");
const { Timer, TIMER_CONSTANTS } = require("../timer");
const configManager = require("../config");
const makeTimerManager = require("./makeTimerManager");
const notify = require("../notifier");

const TimerManager = makeTimerManager({
  EPP,
  Timer,
  Logger,
  notify,
  Speaker,
  configManager,
  MS_IN_ONE_SECOND: TIMER_CONSTANTS.MS_IN_ONE_SECOND,
});

const timerManager = new TimerManager();

module.exports = timerManager;
