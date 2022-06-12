const { EPP } = require("../util");
const Logger = require("../logger");
const Speaker = require("../speaker");
const { Timer, TIMER_CONSTANTS } = require("../timer");
const { configManager, TIMER_LOGS_DIR_PATH } = require("../config");
const makeTimerManager = require("./makeTimerManager");
const notify = require("../notifier");

const TimerManager = makeTimerManager({
  EPP,
  Timer,
  Logger,
  notify,
  Speaker,
  configManager,
  TIMER_LOGS_DIR_PATH,
  MS_IN_ONE_SECOND: TIMER_CONSTANTS.MS_IN_ONE_SECOND,
});

const timerManager = new TimerManager();

module.exports = timerManager;
