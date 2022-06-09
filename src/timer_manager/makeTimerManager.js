module.exports = function makeTimerManager({
  EPP,
  Timer,
  Logger,
  Speaker,
  configManager,
}) {
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

    async execute(commandObject) {
      try {
        await this.#execute(commandObject);
      } catch (ex) {
        console.error(ex);
        // @TODO handle error
      }
    }

    async #execute(commandObject) {
      // @TODO do validation
      const { commandName, commandArg } = commandObject;

      switch (commandName) {
        case "CREATE":
          this.#createTimer(commandArg);
          break;
        case "RESET":
          break;
        case "START":
          this.#startTimer(commandArg);
          break;
        case "PAUSE":
          break;
        case "END":
          break;
        case "SAVE":
          break;
        case "UPDATE_CONFIG":
          await this.#updateConfig();
          break;
        default:
          throw new EPP(`Invalid Command "${commandName}"`);
      }
    }

    #startTimer(timerName) {
      if (timerName) {
        if (timerName in this.#savedTimers)
          this.#currentTimer = this.#savedTimers[timerName];
        else throw new EPP(`No saved timer with name: "${timerName}"`);
      }

      if (!this.#currentTimer) throw new EPP(`No timer exists.`);

      this.#currentTimer.start();
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
