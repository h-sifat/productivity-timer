const fs = require("fs");
const fsp = fs.promises;
const path = require("path");

const { isDatesEqual, required, EPP, exists, deepFreeze } = require("../util");
const makeTimerLogger = require("./makeTimerLogger");

const TimerLogger = makeTimerLogger({
  fs,
  EPP,
  fsp,
  path,
  exists,
  required,
  deepFreeze,
  isDatesEqual,
});

module.exports = TimerLogger;
