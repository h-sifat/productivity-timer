const required = require("../util/required");
const EPP = require("../util/epp");

module.exports = function makeValidateTimerInfo({
  TIMER_CONSTANTS,
  convertToMilliSeconds,
}) {
  return function validateTimerInfo(arg) {
    let {
      description = "",
      name = required("name"),
      unit = required("unit"),
      duration = required("duration"),
    } = arg;

    if (
      typeof name !== "string" ||
      !name.length ||
      name.length > TIMER_CONSTANTS.MAX_NAME_LENGTH
    )
      throw new EPP(`Invalid name: "${name}".`, "INVALID_NAME");

    if (unit in TIMER_CONSTANTS.DURATION_UNIT_ALIASES)
      unit = TIMER_CONSTANTS.DURATION_UNIT_ALIASES[unit];

    if (
      typeof unit !== "string" ||
      !TIMER_CONSTANTS.VALID_DURATION_UNITS.includes(unit.toLowerCase())
    )
      throw new EPP(`Invalid duration unit: "${unit}"`, "INVALID_TIME_UNIT");

    if (typeof duration !== "number" || !Number.isInteger(duration))
      throw new EPP(`Invalid duration: "${duration}".`, "INVALID_DURATION");

    if (
      typeof description !== "string" ||
      description.length > TIMER_CONSTANTS.MAX_DESCRIPTION_LENGTH
    )
      throw new EPP(
        `Invalid description: "${description}"`,
        "INVALID_DESCRIPTION"
      );

    unit = unit.toLowerCase();
    const durationMS = convertToMilliSeconds({ duration, unit });

    if (
      durationMS < TIMER_CONSTANTS.MIN_DURATION_MS ||
      durationMS > TIMER_CONSTANTS.MAX_DURATION_MS
    )
      throw new EPP(
        `duration must be within range: ${TIMER_CONSTANTS.MIN_DURATION_MS}ms to ${TIMER_CONSTANTS.MAX_DURATION_MS}ms`,
        "INVALID_DURATION"
      );

    return {
      name,
      unit,
      duration,
      durationMS,
      description,
    };
  };
};
