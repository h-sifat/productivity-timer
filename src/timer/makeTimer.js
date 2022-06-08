module.exports = function makeTimer(arg) {
  const {
    EPP,
    required,
    TIMER_STATES,
    TIMER_CONSTANTS,
    INVALID_STATE_MESSAGES,
  } = arg;

  return class Timer {
    #name;
    #timerId;
    #duration;
    #callback;
    #events = [];
    #remainingTime;
    #elapsedTime = 0;
    #state = TIMER_STATES.NOT_STARTED;

    constructor(arg = {}) {
      if (typeof arg !== "object" || !arg)
        throw new EPP(
          "Argument to timer constructor must a non null object.",
          "ARG_NOT_OBJECT"
        );

      const {
        name = required("name"),
        duration = required("duration"),
        callback = required("callback"),
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

      if (typeof callback !== "function")
        throw new EPP("duration must be a function", "INVALID_CALLBACK");

      this.#name = name;
      this.#callback = callback;
      this.#duration = this.#remainingTime =
        duration * TIMER_CONSTANTS.MS_IN_ONE_SECOND;
    }

    /**
     * Starts the timer is it is in PAUSED or TIMER_CONSTANTS sate
     * @returns {{success: true} | {success: false, message: string}}
     * {success: true} if state is PAUSED or TIMER_CONSTANTS otherwise
     * {success: false}
     * * */
    start() {
      // get the startTime ASAP
      const METHOD_CALL_TIMESTAMP = Date.now();

      switch (this.#state) {
        case TIMER_STATES.PAUSED:
          this.#events.push(
            Object.freeze({ name: "resume", time: METHOD_CALL_TIMESTAMP })
          );
          this.#state = TIMER_STATES.RUNNING;
          break;

        case TIMER_STATES.NOT_STARTED:
          this.#events.push(
            Object.freeze({ name: "start", time: METHOD_CALL_TIMESTAMP })
          );
          this.#state = TIMER_STATES.RUNNING;
          break;

        default:
          return {
            success: false,
            message: INVALID_STATE_MESSAGES[this.#state],
          };
      }

      this.#timerId = setInterval(
        () => this.#tick(),
        TIMER_CONSTANTS.MS_IN_ONE_SECOND
      );
      return TIMER_CONSTANTS.SUCCESS_RESULT;
    }

    /**
     * Pauses the timer if it is in RUNNING state.
     * @returns {{success: true} | {success: false, message: string}}
     * */
    pause() {
      // get the pauseTime ASAP
      const METHOD_CALL_TIMESTAMP = Date.now();

      if (this.#state !== TIMER_STATES.RUNNING)
        return {
          success: false,
          message: INVALID_STATE_MESSAGES.NOT_RUNNING,
        };

      clearInterval(this.#timerId);
      this.#events.push(
        Object.freeze({ name: "pause", time: METHOD_CALL_TIMESTAMP })
      );
      this.#state = TIMER_STATES.PAUSED;

      return TIMER_CONSTANTS.SUCCESS_RESULT;
    }

    /**
     * Ends the timer if it is in RUNNING or PAUSED state and calls the callback.
     * @returns {{success: true} | {success: false, message: string}}
     * */
    end() {
      const METHOD_CALL_TIMESTAMP = Date.now();

      switch (this.#state) {
        case TIMER_STATES.PAUSED:
        case TIMER_STATES.RUNNING:
          clearInterval(this.#timerId);
          this.#state = TIMER_STATES.ENDED;
          this.#events.push(
            Object.freeze({ name: "end", time: METHOD_CALL_TIMESTAMP })
          );

          this.#callback(this.info());
          return TIMER_CONSTANTS.SUCCESS_RESULT;

        default:
          return {
            success: false,
            message: INVALID_STATE_MESSAGES[this.#state],
          };
      }
    }

    /**
     * Resets the timer in any state.
     * @returns {{success: true}}
     * */
    reset() {
      clearInterval(this.#timerId);

      this.#events = [];
      this.#elapsedTime = 0;
      this.#timerId = undefined;
      this.#remainingTime = this.#duration;
      this.#state = TIMER_STATES.NOT_STARTED;

      return TIMER_CONSTANTS.SUCCESS_RESULT;
    }

    /**
     * Decrements the `remainingTime` and increments the `elapsedTime` by 1000ms
     * on every call. Calls the `Timer.#timeUp()` method (after performing the
     * increment and decrement) if `remainingTime <= 0`.
     */
    #tick() {
      this.#remainingTime -= TIMER_CONSTANTS.MS_IN_ONE_SECOND;
      this.#elapsedTime += TIMER_CONSTANTS.MS_IN_ONE_SECOND;

      if (this.#remainingTime <= 0) this.#timeUp();
    }

    /**
     * Should only be called by the `Timer.#tick()` method and performs the
     * following tasks.
     * 1. Clears the tick interval
     * 1. Pushes the `"time_up"` event in `Timer.#events` array
     * 1. Sets the state to `TIMER_STATES.TIMED_UP`
     * 1. Calls the `Timer.#callback` with the timer info.
     *
     * @throws {EPP} if called in any state other than `TIMER_STATES.RUNNING`
     */
    #timeUp() {
      // get the endTime ASAP
      const METHOD_CALL_TIMESTAMP = Date.now();

      if (this.#state !== TIMER_STATES.RUNNING)
        throw new EPP(
          "Internal error from #timeUp(): timer is not running.",
          "IE:TIMER_NOT_RUNNING"
        );

      clearInterval(this.#timerId);
      this.#state = TIMER_STATES.TIMED_UP;
      this.#events.push(
        Object.freeze({ name: "time_up", time: METHOD_CALL_TIMESTAMP })
      );

      this.#callback(this.info());
    }

    /**
     * @returns {{
     *  name: string,
     *  state: string,
     *  duration: number,
     *  events: ({name: "start" | "end" | "time_up" | "pause" | "resume", time: number})[],
     *  elapsedTime: number,
     *  remainingTime: number,
     * }}
     * */
    info() {
      return {
        name: this.#name,
        duration: this.#duration,
        events: [...this.#events],
        elapsedTime: this.#elapsedTime,
        state: TIMER_STATES[this.#state],
        remainingTime: this.#remainingTime,
      };
    }
  };
};
