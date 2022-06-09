module.exports = function makeValidateTimerInfo({
  TIMER_CONSTANTS,
  EPP,
  required,
}) {
  return function validateTimerInfo(arg) {
    let {
      name = required("name"),
      duration = required("duration"),
      description = required("description"),
    } = arg;

    if (
      typeof name !== "string" ||
      !name.length ||
      name.length > TIMER_CONSTANTS.MAX_NAME_LENGTH
    )
      throw new EPP(`Invalid name: "${name}".`, "INVALID_NAME");

    if (
      typeof duration !== "number" ||
      !Number.isInteger(duration) ||
      duration < TIMER_CONSTANTS.MIN_DURATION_SECONDS ||
      duration > TIMER_CONSTANTS.MAX_DURATION_SECONDS
    )
      throw new EPP(`Invalid duration: "${duration}".`, "INVALID_DURATION");

    if (!description) description = "";
    if (
      typeof description !== "string" ||
      description.length > TIMER_CONSTANTS.MAX_DESCRIPTION_LENGTH
    )
      throw new EPP(
        `Invalid description: "${description}"`,
        "INVALID_DESCRIPTION"
      );

    return { name, duration, description };
  };
};
