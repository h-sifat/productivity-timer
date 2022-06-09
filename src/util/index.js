const fs = require("fs");
const fsp = fs.promises;
const deepFreeze = require("./deepFreeze");

async function exists(filepath, mode) {
  try {
    await fsp.access(filepath, mode);
    return true;
  } catch (ex) {
    return false;
  }
}

class EPP extends Error {
  constructor(message, code, otherInfo = {}) {
    super(message);
    this.code = code;
    Object.assign(this, otherInfo);
  }
}

/**
 * Used in object destructuring to make sure that a required property is not
 * missing. If a required property is missing it throws an error.
 *
 * Example:
 * ```js
 * const {name = required("name")} = person;
 * ```
 * */
function required(name) {
  throw new EPP(`Property "${name}" is missing.`, "MISSING_PROPERTY");
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

module.exports = {
  EPP,
  exists,
  required,
  makeEnum,
  deepFreeze,
  isDatesEqual,
  assertNonNullObject,
};
