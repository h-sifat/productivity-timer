const { EPP, required } = require("./util");

const MAX_NAME_LENGTH = 30;
const MIN_DURATION_SECONDS = 5;
const MAX_DURATION_SECONDS = 24 * 60 * 60; // 24 hours

/**
 * A timer has properties
 * 1. name
 * 2. start time
 * 3. end time
 * 4. elapsed time
 * 5. remaining time
 *
 * functionalities
 * start, stop, pause, suspend
 * */
class Timer {
  #name;
  #state = "NOT_STARTED";
  #startTime;
  #elapsedTime = 0;
  #remainingTime;
  #duration;

  constructor(arg = {}) {
    if (typeof arg !== "object" || !arg)
      throw new EPP(
        "Argument to timer constructor must a non null object.",
        "ARG_NOT_OBJECT"
      );

    const { name = required("name"), duration = required("duration") } = arg;

    if (
      typeof name !== "string" ||
      !name.length ||
      name.length > MAX_NAME_LENGTH
    )
      throw new EPP(`Invalid name: "${name}".`, "INVALID_NAME");

    if (
      typeof duration !== "number" ||
      !Number.isInteger(duration) ||
      duration < MIN_DURATION_SECONDS ||
      duration > MAX_DURATION_SECONDS
    )
      throw new EPP(`Invalid duration: "${duration}".`, "INVALID_DURATION");

    this.#name = name;
    this.#duration = this.#remainingTime = duration;
  }

  info() {
    return {
      name: this.#name,
      state: this.#state,
      duration: this.#duration,
      startTime: this.#startTime,
      elapsedTime: this.#elapsedTime,
      remainingTime: this.#remainingTime,
    };
  }
}

module.exports = {
  Timer,
  MAX_NAME_LENGTH,
  MIN_DURATION_SECONDS,
  MAX_DURATION_SECONDS,
};
