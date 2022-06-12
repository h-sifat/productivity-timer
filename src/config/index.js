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

const ConfigManager = makeConfigManager({
  EPP,
  fsp,
  path,
  notify,
  Logger,
  exists,
  deepFreeze,
  validateTimerInfo,
  assertNonNullObject,
  mkdirIfDoesNotExist,
  MS_IN_ONE_SECOND: TIMER_CONSTANTS.MS_IN_ONE_SECOND,
});

const configManager = new ConfigManager();

module.exports = configManager;
