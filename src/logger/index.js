const fs = require("fs");
const fsp = fs.promises;
const path = require("path");

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
  required,
  deepFreeze,
  isDatesEqual,
  mkdirIfDoesNotExist,
});

module.exports = Logger;
