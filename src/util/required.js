/**
 * Used in object destructuring to make sure that a required property is not
 * missing. If a required property is missing it throws an error.
 *
 * Example:
 * ```js
 * const {name = required("name")} = person;
 * ```
 * */
module.exports = function required(name) {
  throw new EPP(`Property "${name}" is missing.`, "MISSING_PROPERTY");
};
