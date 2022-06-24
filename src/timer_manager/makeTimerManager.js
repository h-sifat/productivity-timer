module.exports = function makeTimerManager({
  EPP,
  Timer,
  Speaker,
  timerLogger,
  TIMER_STATES,
  configManager,
  commandSchemas,
  MS_IN_ONE_SECOND,
  normalizeCommandObject,
}) {
  const MS_IN_ONE_DAY = 24 * 60 * 60 * MS_IN_ONE_SECOND;
  const TIMER_SPECIFIC_COMMANDS = Object.freeze([
    "END",
    "INFO",
    "RESET",
    "START",
    "PAUSE",
  ]);
  const ALL_COMMANDS = Object.freeze([
    "SAVE",
    "STATS",
    "CREATE",
    "STOP_BEEPING",
    "UPDATE_CONFIG",
    "LIST_SAVED_TIMERS",
    "DELETE_SAVED_TIMER",
    ...TIMER_SPECIFIC_COMMANDS,
  ]);
  /**
   * A singleton that manages CRUD operations on timers
   * */
  return class TimerManager {
    #speaker;
    #currentTimer;

    #beepDuration;
    #savedTimers = {};
    #commandAliases = {};

    #isBeeping = false;
    #setIsBeepingToTrue = () => {
      this.#isBeeping = true;
    };
    #setIsBeepingToFalse = () => {
      this.#isBeeping = false;
    };

    #timerCallback = async (timerInfo) => {
      if (TIMER_STATES[timerInfo.state] !== TIMER_STATES.ENDED)
        this.#speaker.on(this.#beepDuration);

      await timerLogger.log(timerInfo);
    };

    static #instance = null;
    constructor() {
      if (TimerManager.#instance) return TimerManager.#instance;
      TimerManager.#instance = this;
    }

    #isInitiated = false;
    async init() {
      if (this.#isInitiated) return;

      await configManager.init({ allTimerManagerCommands: ALL_COMMANDS });
      // as the configManager has just initiated, we don't need to read the
      // config file again
      await this.#retrieveAndSetConfig({ updateConfig: false });

      await timerLogger.init();

      this.#speaker = new Speaker({
        onCallback: this.#setIsBeepingToTrue,
        offCallback: this.#setIsBeepingToFalse,
      });

      this.#isInitiated = true;
    }

    /**
     * @returns {{ success: true } | {success: false, message: string}}
     * */
    async execute(commandObject) {
      commandObject = normalizeCommandObject({
        commandObject,
        commandSchemas,
        commandAliases: this.#commandAliases,
      });

      try {
        const result = (await this.#execute(commandObject)) || {
          data: null,
          success: true,
        };
        return result;
      } catch (ex) {
        return { success: false, message: ex.message };
      }
    }

    async #execute(commandObject) {
      const { command, argument } = commandObject;

      // if any command issued while the timer is beeping
      // then turn off the beeping.
      if (this.#isBeeping) this.#stopBeeping();
      if (command === "STOP_BEEPING") return;

      const isTimerCommandWithoutArgument =
        TIMER_SPECIFIC_COMMANDS.includes(command) &&
        !(command === "START" && argument);

      if (isTimerCommandWithoutArgument) {
        return this.#currentTimer
          ? this.#currentTimer[command.toLowerCase()]()
          : { success: false, message: "No timer exists." };
      }

      switch (command) {
        case "CREATE":
          return this.#createTimer(argument);
        case "START":
          return this.#startTimer(argument);
        case "SAVE":
          await this.#saveTimer(argument);
          break;
        case "UPDATE_CONFIG":
          await this.#retrieveAndSetConfig();
          break;
        case "LIST_SAVED_TIMERS":
          return { success: true, data: this.#listSavedTimers() };
        case "DELETE_SAVED_TIMER":
          await configManager.deleteSavedTimer(argument);
          await this.#retrieveAndSetConfig();
          break;
        case "STATS":
          return { success: true, data: await this.#getStats(argument) };
        default:
          return {
            success: false,
            message: `Invalid command: "${command}"`,
          };
      }
    }

    async #getStats(dateString) {
      const VALID_DATE_PATTERN = /^\d{2}-\d{2}-\d{4}$/; // mm-dd-yyyy
      let date;

      if (typeof dateString === "number") {
        const numOfDaysBeforeToday = dateString;
        if (
          !Number.isInteger(numOfDaysBeforeToday) ||
          numOfDaysBeforeToday <= 0
        )
          throw new Error(
            `Cannot go "${numOfDaysBeforeToday}" days back from today.`
          );

        date = new Date(Date.now() - MS_IN_ONE_DAY * numOfDaysBeforeToday);
      } else if (typeof dateString === "string") {
        const isInvalidDate =
          !VALID_DATE_PATTERN.test(dateString) ||
          (date = new Date(dateString)).toString() === "Invalid Date";

        if (isInvalidDate)
          throw new Error(
            `Invalid date string: "${dateString}". Use format: "mm-dd-yyyy".`
          );
      }

      const logs = await timerLogger.getLogs(date);
      return this.#aggregateLogs(logs);
    }

    #aggregateLogs(logs) {
      const aggregatedResult = { timerCount: 0, totalDurationMs: 0 };
      const timers = {};

      for (const { name: timerName, description, elapsedTimeMS } of logs) {
        aggregatedResult.totalDurationMs += elapsedTimeMS;
        aggregatedResult.timerCount++;

        if (timerName in timers) {
          timers[timerName].totalDurationMs += elapsedTimeMS;
          timers[timerName].count++;
          continue;
        }

        timers[timerName] = {
          count: 1,
          description,
          totalDurationMs: elapsedTimeMS,
        };
      }

      aggregatedResult.timers = timers;

      return aggregatedResult;
    }

    #stopBeeping() {
      this.#speaker.off();
    }

    async #saveTimer(timerInfo) {
      if (timerInfo) {
        await configManager.saveTimer({ timerInfo });

        const newTimer = new Timer({
          ...timerInfo,
          callback: this.#timerCallback,
        });

        this.#savedTimers[timerInfo.name] = newTimer;
        return;
      }

      if (!this.#currentTimer)
        return { success: false, message: "No timer exists." };

      const currentTimerInfo = this.#currentTimer.info({ brief: true });
      await configManager.saveTimer({
        isTrusted: true,
        timerInfo: currentTimerInfo,
      });
      this.#savedTimers[currentTimerInfo.name] = this.#currentTimer;
    }

    #listSavedTimers() {
      return Object.values(this.#savedTimers).map((timer) =>
        timer.info({ brief: true })
      );
    }
    #startTimer(timerName) {
      if (this.#currentTimer) {
        const { state, name } = this.#currentTimer.info();

        const isActiveTimer = ![
          TIMER_STATES.ENDED,
          TIMER_STATES.TIMED_UP,
        ].includes(TIMER_STATES[state]);

        if (isActiveTimer)
          throw new EPP(
            `An unfinished timer (${name}) already exists. Please End or Reset it first.`,
            "TIMER_ALREADY_EXISTS"
          );
      }

      if (timerName in this.#savedTimers) {
        this.#currentTimer = this.#savedTimers[timerName];
        this.#currentTimer.reset();
      } else throw new EPP(`No saved timer with name: "${timerName}"`);

      return this.#currentTimer.start();
    }

    #createTimer(timerInfo) {
      this.#currentTimer = new Timer({
        ...timerInfo,
        callback: this.#timerCallback,
      });
    }

    async #retrieveAndSetConfig({ updateConfig = true } = {}) {
      if (updateConfig) await configManager.updateConfig();

      const { beepDuration, savedTimers, commandAliases } =
        await configManager.getConfig();

      this.#beepDuration = beepDuration;
      this.#commandAliases = commandAliases;

      this.#savedTimers = {};
      for (const [timerName, timerInfo] of Object.entries(savedTimers))
        this.#savedTimers[timerName] = new Timer({
          ...timerInfo,
          callback: this.#timerCallback,
        });
    }
  };
};
