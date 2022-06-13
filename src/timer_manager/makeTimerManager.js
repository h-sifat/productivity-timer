module.exports = function makeTimerManager({
  EPP,
  Timer,
  Logger,
  Speaker,
  configManager,
  MS_IN_ONE_SECOND,
  TIMER_LOGS_DIR_PATH,
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
    #timerLogger;
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
      this.#speaker.on(this.#beepDuration);
      await this.#timerLogger.log(timerInfo);
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

      this.#timerLogger = new Logger({ logsDir: TIMER_LOGS_DIR_PATH });
      await this.#timerLogger.init();

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
      try {
        const result = await this.#execute(commandObject);
        return result ? result : { success: true };
      } catch (ex) {
        return { success: false, message: ex.message };
      }
    }

    async #execute(commandObject) {
      const arg = commandObject.arg;
      let command = commandObject.command;

      if (command in this.#commandAliases)
        // now command represents an alias and this.#commandAliases[command]
        // is the actual command
        command = this.#commandAliases[command];

      if (this.#isBeeping) {
        this.#stopBeeping();

        if (command === "STOP_BEEPING") return;
      }

      const isTimerCommandWithoutArg =
        // if commandName is a timer command AND
        // (if commandName is not "START" with a timer name)
        TIMER_SPECIFIC_COMMANDS.includes(command) &&
        !(command === "START" && arg);

      if (isTimerCommandWithoutArg) {
        return this.#currentTimer
          ? this.#currentTimer[command.toLowerCase()]()
          : { success: false, message: "No timer exists." };
      }

      switch (command) {
        case "CREATE":
          return this.#createTimer(arg);
        case "START":
          return this.#startTimer(arg);
        case "SAVE":
          await this.#saveTimer(arg);
          break;
        case "UPDATE_CONFIG":
          await this.#retrieveAndSetConfig();
          break;
        case "LIST_SAVED_TIMERS":
          return this.#listSavedTimers();
        case "DELETE_SAVED_TIMER":
          await configManager.deleteSavedTimer(arg);
          await this.#retrieveAndSetConfig();
          break;
        case "STATS":
          return this.#getStats(arg);
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

      const logs = await this.#timerLogger.getLogs(date);
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
      if (timerName in this.#savedTimers)
        this.#currentTimer = this.#savedTimers[timerName];
      else throw new EPP(`No saved timer with name: "${timerName}"`);

      return this.#currentTimer.start();
    }

    #createTimer(timerInfo) {
      this.#currentTimer = new Timer({
        ...timerInfo,
        callback: this.#timerCallback,
      });
    }

    async #retrieveAndSetConfig({ updateConfig = true }) {
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
