module.exports = function makeTimerManager({
  EPP,
  Timer,
  Logger,
  Speaker,
  configManager,
}) {
  /**
   * A singleton that manages CRUD operations on timers
   * */
  return class TimerManager {
    #timerLogger;
    #currentTimer;
    #timerLogsDir = configManager.constants.TIMER_LOGS_DIR;

    #beepDuration;
    #savedTimers = {};
    #timerCallback = async (timerInfo) => {
      Speaker.on(this.#beepDuration);
      await this.#timerLogger.log(timerInfo);
    };

    #timerCommands = Object.freeze(["END", "INFO", "RESET", "START", "PAUSE"]);

    #isInitiated = false;

    static #instance = null;
    constructor() {
      if (TimerManager.#instance) return TimerManager.#instance;
      TimerManager.#instance = this;
    }

    async init() {
      if (this.#isInitiated) return;

      await configManager.init();
      await this.#updateConfig();

      this.#timerLogger = new Logger({ logsDir: this.#timerLogsDir });
      await this.#timerLogger.init();

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
        // @TODO handle error
        // console.error(ex);
        return { success: false, message: ex.message };
      }
    }

    async #execute(commandObject) {
      const { command, arg } = commandObject;

      const isTimerCommandWithoutArg =
        // if commandName is a timer command AND
        // (if commandName is not "START" with a timer name)
        this.#timerCommands.includes(command) && !(command === "START" && arg);

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
          await this.#saveTimer();
          break;
        case "UPDATE_CONFIG":
          await this.#updateConfig();
          break;
        case "LIST_SAVED_TIMERS":
          return this.#listSavedTimers();
        case "DELETE_SAVED_TIMER":
          await configManager.deleteSavedTimer(arg);
          await this.#updateConfig();
          break;
        default:
          return {
            success: false,
            message: `Invalid command: "${command}"`,
          };
      }
    }

    async #saveTimer() {
      if (this.#currentTimer)
        await configManager.saveTimer(
          this.#getBasicTimerInfo(this.#currentTimer)
        );
      else return { success: false, message: "No timer exists." };
    }

    #listSavedTimers() {
      return Object.values(this.#savedTimers).map(this.#getBasicTimerInfo);
    }

    #getBasicTimerInfo = (timer) => {
      const { name, duration, description } = timer.info();
      return { name, duration, description };
    };

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

    async #updateConfig() {
      const { beepDuration, savedTimers } = await configManager.getConfig();
      this.#beepDuration = beepDuration;

      for (const [timerName, timerInfo] of Object.entries(savedTimers))
        this.#savedTimers[timerName] = new Timer({
          ...timerInfo,
          callback: this.#timerCallback,
        });
    }
  };
};
