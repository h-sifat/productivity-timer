const fs = require("fs");
const EPP = require("./epp");
const required = require("./required");
const deepFreeze = require("./deepFreeze");
const convertDuration = require("./convertDuration");

const fsp = fs.promises;

async function exists(filepath, mode) {
  try {
    await fsp.access(filepath, mode);
    return true;
  } catch (ex) {
    return false;
  }
}

/**
 * Makes an enum and returns a frozen object.
 *
 * Example
 * ```js
 * const _enum = makeEnum({keys: ["A", "B"]})
 *
 * // produces
 * _enum = {
 *  "A": 1,
 *  "B": 2,
 *  "1": "A",
 *  "2": "B"
 * }
 * ```
 *
 * @param {{keys: string[], startingValue?: number}}
 * @returns {ReadOnly<{string: string|number}>}
 * */
function makeEnum({ keys, startingValue = 1 }) {
  const _enum = {};

  for (const key of keys) _enum[key] = startingValue++;
  for (const [key, value] of Object.entries(_enum)) _enum[value] = key;

  return Object.freeze(_enum);
}

function isDatesEqual(dateA, dateB) {
  return dateA.toLocaleDateString() === dateB.toLocaleDateString();
}

function assertNonNullObject({
  object,
  name = "object",
  errorCode = "NOT_NON_NULL_OBJECT",
}) {
  if (typeof object !== "object" || object === null)
    throw new EPP(`${name} must be a non null object.`, errorCode);
}

function assertString({ value, name = "Value" } = {}) {
  if (typeof value !== "string")
    throw new Error(`${name} must be of type string.`);
}

function assertFunction({ value, name = "Value" } = {}) {
  if (typeof value !== "function")
    throw new Error(`${name} must be of type function.`);
}

function assertPlainObject({
  object,
  name = "object",
  errorCode = "NOT_PLAIN_OBJECT",
}) {
  if (typeof object !== "object" || object === null || Array.isArray(object))
    throw new EPP(`${name} must be a plain object.`, errorCode);
}

async function mkdirIfDoesNotExist(arg) {
  const dir = arg.dir;
  const {
    mkdirFailedMessage = `Couldn't create directory: "${dir}"`,
    dirInaccessibleMessage = `Directory "${dir}" is inaccessible.`,
  } = arg;

  if (await exists(dir)) {
    const hasReadWritePermission = await exists(
      dir,
      fs.constants.R_OK | fs.constants.W_OK // with read and write permission
    );

    if (!hasReadWritePermission)
      throw new EPP(dirInaccessibleMessage, "DIR_INACCESSIBLE", {
        originalError: ex,
      });
  } else {
    try {
      await fsp.mkdir(dir, { recursive: true });
    } catch (ex) {
      throw new EPP(mkdirFailedMessage, "COULD_NOT_CREATE_DIR", {
        originalError: ex,
      });
    }
  }
}

function convertToMilliSeconds(arg = {}) {
  const { duration = required("duration"), unit = required("unit") } = arg;
  return convertDuration({ duration, fromUnit: unit, toUnit: "millisecond" });
}

module.exports = {
  EPP,
  exists,
  required,
  makeEnum,
  deepFreeze,
  isDatesEqual,
  assertString,
  assertFunction,
  assertPlainObject,
  mkdirIfDoesNotExist,
  assertNonNullObject,
  convertToMilliSeconds,
};
