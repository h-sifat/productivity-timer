module.exports = function makeTimer(arg) {
  const {
    EPP,
    required,
    TIMER_STATES,
    TIMER_CONSTANTS,
    validateTimerInfo,
    assertNonNullObject,
    INVALID_STATE_MESSAGES,
  } = arg;

  return class Timer {
    #name;
    #unit;
    #timerId;
    #duration;
    #callback;
    #durationMS;
    #description;
    #events = [];
    #remainingTimeMS;
    #elapsedTimeMS = 0;
    #state = TIMER_STATES.NOT_STARTED;

    constructor(arg = {}) {
      assertNonNullObject({
        object: arg,
        errorCode: "ARG_NOT_OBJECT",
        name: "Argument to Timer constructor",
      });

      const { callback = required("callback") } = arg;

      if (typeof callback !== "function")
        throw new EPP("callback must be a function", "INVALID_CALLBACK");
      this.#callback = callback;

      const { name, unit, duration, durationMS, description } =
        validateTimerInfo(arg);

      this.#unit = unit;
      this.#name = name;
      this.#duration = duration;
      this.#durationMS = this.#remainingTimeMS = durationMS;
      this.#description = description;
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

      let message;
      switch (this.#state) {
        case TIMER_STATES.PAUSED:
          this.#events.push(
            Object.freeze({ name: "resume", time: METHOD_CALL_TIMESTAMP })
          );
          this.#state = TIMER_STATES.RUNNING;
          message = `Resumed timer "${this.#name}"`;
          break;

        case TIMER_STATES.NOT_STARTED:
          this.#events.push(
            Object.freeze({ name: "start", time: METHOD_CALL_TIMESTAMP })
          );
          this.#state = TIMER_STATES.RUNNING;
          message = `Started timer "${this.#name}"`;
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
      return { success: true, message };
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

      return { success: true, message: `Paused timer "${this.#name}"` };
    }

    /**
     * Ends the timer if it is in RUNNING or PAUSED state and calls the callback.
     * __Note:__ This function is async because the timer callback may be async!
     * @returns {{success: true} | {success: false, message: string}}
     *
     * */
    async end() {
      const METHOD_CALL_TIMESTAMP = Date.now();

      switch (this.#state) {
        case TIMER_STATES.PAUSED:
        case TIMER_STATES.RUNNING:
          clearInterval(this.#timerId);
          this.#state = TIMER_STATES.ENDED;
          this.#events.push(
            Object.freeze({ name: "end", time: METHOD_CALL_TIMESTAMP })
          );

          try {
            await this.#callback(this.info());
          } catch {}
          return { success: true, message: `Ended timer "${this.#name}"` };

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
      this.#elapsedTimeMS = 0;
      this.#timerId = undefined;
      this.#remainingTimeMS = this.#durationMS;
      this.#state = TIMER_STATES.NOT_STARTED;

      return { success: true, message: `Reset timer "${this.#name}"` };
    }

    /**
     * Decrements the `remainingTime` and increments the `elapsedTime` by 1000ms
     * on every call. Calls the `Timer.#timeUp()` method (after performing the
     * increment and decrement) if `remainingTime <= 0`.
     */
    #tick() {
      this.#remainingTimeMS -= TIMER_CONSTANTS.MS_IN_ONE_SECOND;
      this.#elapsedTimeMS += TIMER_CONSTANTS.MS_IN_ONE_SECOND;

      if (this.#remainingTimeMS <= 0) this.#timeUp();
    }

    /**
     * Should only be called by the `Timer.#tick()` method. It performs the
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
     *  durationMS: number,
     *  unit: "s" | "m" | "h" | "hour" | "second" | "minute"
     *  description: string,
     *  events: ({name: "start" | "end" | "time_up" | "pause" | "resume", time: number})[],
     *  elapsedTimeMS: number,
     *  remainingTimeMS: number,
     * }}
     * */
    info({ brief = false } = {}) {
      const briefInfo = {
        name: this.#name,
        unit: this.#unit,
        duration: this.#duration,
        description: this.#description,
      };

      if (brief) return briefInfo;

      return {
        ...briefInfo,
        events: [...this.#events],
        durationMS: this.#durationMS,
        state: TIMER_STATES[this.#state],
        elapsedTimeMS: this.#elapsedTimeMS,
        remainingTimeMS: this.#remainingTimeMS,
      };
    }
  };
};
