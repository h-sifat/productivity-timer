const { EPP } = require("../util");
const Logger = require("../logger");
const Speaker = require("../speaker");
const { Timer, TIMER_CONSTANTS, TIMER_STATES } = require("../timer");
const { configManager, TIMER_LOGS_DIR_PATH } = require("../config");
const makeTimerManager = require("./makeTimerManager");
const notify = require("../notifier");

const timerLogger = new Logger({ logsDir: TIMER_LOGS_DIR_PATH });

const TimerManager = makeTimerManager({
  EPP,
  Timer,
  notify,
  Speaker,
  timerLogger,
  TIMER_STATES,
  configManager,
  MS_IN_ONE_SECOND: TIMER_CONSTANTS.MS_IN_ONE_SECOND,
});

const timerManager = new TimerManager();

module.exports = timerManager;
