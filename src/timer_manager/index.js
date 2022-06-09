const { EPP } = require("../util");
const Logger = require("../logger");
const Speaker = require("../speaker");
const { Timer } = require("../timer");
const configManager = require("../config");
const makeTimerManager = require("./makeTimerManager");

const TimerManager = makeTimerManager({
  EPP,
  Timer,
  Logger,
  Speaker,
  configManager,
});

const timerManager = new TimerManager();

module.exports = timerManager;
