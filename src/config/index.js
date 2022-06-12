const path = require("path");
const { promises: fsp } = require("fs");
const {
  EPP,
  exists,
  deepFreeze,
  assertNonNullObject,
  mkdirIfDoesNotExist,
} = require("../util");

const makeConfigManager = require("./makeConfigManager");
const { TIMER_CONSTANTS, validateTimerInfo } = require("../timer");
const notify = require("../notifier");
const Logger = require("../logger");

// ------- Config Variables -----------
const TIMER_LOGS_DIR_NAME = "logs";
const ERRORS_DIR_NAME = "errors";
const TIMER_DIR_NAME = ".p_timer";
const CONFIG_FILE_NAME = "config.json";

const TIMER_DIR_PATH = path.join(process.env.HOME, TIMER_DIR_NAME);
const TIMER_LOGS_DIR_PATH = path.join(TIMER_DIR_PATH, TIMER_LOGS_DIR_NAME);
const ERROR_LOGS_DIR_PATH = path.join(TIMER_DIR_PATH, ERRORS_DIR_NAME);
const CONFIG_FILE_PATH = path.join(TIMER_DIR_PATH, CONFIG_FILE_NAME);
// ------- End Config Variables -----------

const ConfigManager = makeConfigManager({
  EPP,
  fsp,
  path,
  notify,
  Logger,
  exists,
  deepFreeze,
  TIMER_DIR_PATH,
  CONFIG_FILE_PATH,
  validateTimerInfo,
  ERROR_LOGS_DIR_PATH,
  assertNonNullObject,
  mkdirIfDoesNotExist,
  MS_IN_ONE_SECOND: TIMER_CONSTANTS.MS_IN_ONE_SECOND,
});

const configManager = new ConfigManager();

module.exports = {
  configManager,
  CONFIG_FILE_PATH,
  TIMER_LOGS_DIR_PATH,
  ERROR_LOGS_DIR_PATH,
};
