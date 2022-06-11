const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const notify = require("../notifier");

const {
  EPP,
  required,
  deepFreeze,
  isDatesEqual,
  mkdirIfDoesNotExist,
} = require("../util");
const makeLogger = require("./makeLogger");

const Logger = makeLogger({
  EPP,
  fsp,
  path,
  notify,
  required,
  deepFreeze,
  isDatesEqual,
  mkdirIfDoesNotExist,
});

module.exports = Logger;
