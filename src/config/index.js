const path = require("path");
const { promises: fsp } = require("fs");
const {
  EPP,
  exists,
  deepFreeze,
  assertPlainObject,
  mkdirIfDoesNotExist,
} = require("../util");

const Logger = require("../logger");
const notify = require("../notifier");
const makeConfigManager = require("./makeConfigManager");
const { TIMER_CONSTANTS, validateTimerInfo } = require("../timer");
const {
  TIMER_DIR_PATH,
  CONFIG_FILE_PATH,
  SOCKET_PIPE_PATH,
  TIMER_LOGS_DIR_PATH,
  ERROR_LOGS_DIR_PATH,
} = require("./configVariables");

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
  assertPlainObject,
  ERROR_LOGS_DIR_PATH,
  mkdirIfDoesNotExist,
  MS_IN_ONE_SECOND: TIMER_CONSTANTS.MS_IN_ONE_SECOND,
});

const configManager = new ConfigManager();

module.exports = {
  configManager,
  TIMER_DIR_PATH,
  CONFIG_FILE_PATH,
  SOCKET_PIPE_PATH,
  TIMER_LOGS_DIR_PATH,
  ERROR_LOGS_DIR_PATH,
};
