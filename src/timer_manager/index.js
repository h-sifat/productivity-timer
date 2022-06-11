const { EPP } = require("../util");
const Logger = require("../logger");
const Speaker = require("../speaker");
const { Timer } = require("../timer");
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
});

const timerManager = new TimerManager();

module.exports = timerManager;
