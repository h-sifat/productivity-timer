const { EPP } = require("../util");
const Logger = require("../logger");
const Speaker = require("../speaker");
const notify = require("../notifier");
const makeTimerManager = require("./makeTimerManager");
const COMMAND_SCHEMAS = require("./commandSchemas");
const normalizeCommandObject = require("./normalizeCommandObject");
const { configManager, TIMER_LOGS_DIR_PATH } = require("../config");
const { Timer, TIMER_CONSTANTS, TIMER_STATES } = require("../timer");

const timerLogger = new Logger({ logsDir: TIMER_LOGS_DIR_PATH });

const TimerManager = makeTimerManager({
  EPP,
  Timer,
  notify,
  Speaker,
  timerLogger,
  TIMER_STATES,
  configManager,
  normalizeCommandObject,
  commandSchemas: COMMAND_SCHEMAS,
  MS_IN_ONE_SECOND: TIMER_CONSTANTS.MS_IN_ONE_SECOND,
});

const timerManager = new TimerManager();

module.exports = timerManager;
