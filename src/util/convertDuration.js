const EPP = require("./epp");

const msPerUnit = Object.freeze({
  ms: 1,
  s: 1000,
  m: 60000,
  h: 3600000,
  second: 1000,
  minute: 60000,
  hour: 3600000,
  millisecond: 1,
});

module.exports = function convertDuration(arg) {
  // ------ ugly validation
  if (typeof arg !== "object" || arg === null)
    throw new EPP(`Input must be a non null object.`, "INVALID_INPUT");

  for (const property of ["duration", "toUnit", "fromUnit"])
    if (!(property in arg))
      throw new EPP(`Property "${property}" is missing.`, "MISSING_PROPERTY");

  const { duration } = arg;

  if (typeof duration !== "number" || duration <= 0)
    throw new EPP(`Invalid duration: ${duration}`, "INVALID_DURATION");

  for (const property of ["toUnit", "fromUnit"])
    if (!(arg[property] in msPerUnit))
      throw new EPP(`Invalid ${property}: "${arg[property]}"`, "INVALID_UNIT");
  // ----- end of ugly validation

  const { fromUnit, toUnit } = arg;

  const durationMS = duration * msPerUnit[fromUnit];
  return durationMS / msPerUnit[toUnit];
};
