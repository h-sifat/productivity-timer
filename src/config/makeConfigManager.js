module.exports = function makeConfigManager({
  fsp,
  EPP,
  exists,
  notify,
  Logger,
  deepFreeze,
  TIMER_DIR_PATH,
  MS_IN_ONE_SECOND,
  CONFIG_FILE_PATH,
  validateTimerInfo,
  ERROR_LOGS_DIR_PATH,
  assertNonNullObject,
  mkdirIfDoesNotExist,
}) {
  const MIN_BEEP_DURATION = 5 * MS_IN_ONE_SECOND;
  const DEFAULT_BEEP_DURATION = 10 * MS_IN_ONE_SECOND;
  const MAX_BEEP_DURATION = 2 * 60 * MS_IN_ONE_SECOND; // 2 minutes

  /**
   * A singleton that manages all configurations
   * */
  return class ConfigManager {
    #savedTimers = {};
    #invalidSavedTimers = {};
    #beepDuration = DEFAULT_BEEP_DURATION;
    #errorLogger;

    static #instance = null;
    constructor() {
      if (ConfigManager.#instance) return ConfigManager.#instance;
      ConfigManager.#instance = this;
    }

    #isInitiated = false;
    async init() {
      if (this.#isInitiated) return;

      this.#errorLogger = new Logger({
        ignoreLoggingFailure: true,
        logsDir: ERROR_LOGS_DIR_PATH,
        logObjectNormalizer: (error) => {
          const normalizedErrorObject = {
            timestamp: Date.now(),
            errorMessage: error.message,
            stack: error.stack,
          };

          if (error.code) normalizedErrorObject.code = error.code;
          return normalizedErrorObject;
        },
      });
      await this.#errorLogger.init();

      try {
        await mkdirIfDoesNotExist({ dir: TIMER_DIR_PATH });
      } catch (ex) {
        await notify(ex.message);
      }

      if (await exists(CONFIG_FILE_PATH)) this.#readConfigFile();
      else this.#writeConfigFile();

      this.#isInitiated = true;
    }

    async setBeepDuration(durationMS) {
      this.#validateBeepDuration(durationMS);
      this.#beepDuration = durationMS;

      this.#writeConfigFile();
    }

    async #writeConfigFile() {
      const serializedConfig = JSON.stringify({
        savedTimers: { ...this.#savedTimers, ...this.#invalidSavedTimers },
        beepDuration: this.#beepDuration,
      });

      try {
        await fsp.writeFile(CONFIG_FILE_PATH, serializedConfig, "utf8");
      } catch (ex) {
        await this.#errorLogger.log(ex);
        await notify("Couldn't write config file.");
      }
    }

    async #readConfigFile() {
      let serializedConfig;

      try {
        serializedConfig = await fsp.readFile(CONFIG_FILE_PATH, "utf8");
      } catch (ex) {
        await this.#errorLogger.log(ex);
        await notify("Error while reading config file.");
      }

      let configObject;
      try {
        configObject = JSON.parse(serializedConfig);
      } catch (ex) {
        await this.#errorLogger.log(ex);
        await notify("Invalid config file.");
      }

      const { beepDuration, savedTimers } = configObject;

      try {
        this.#validateBeepDuration(beepDuration);
        this.#beepDuration = beepDuration;
      } catch (ex) {
        await this.#errorLogger.log(ex);
        await notify(
          `Invalid beep duration in config: ${beepDuration}. Using the default value!`
        );
        this.#beepDuration = DEFAULT_BEEP_DURATION;
      }

      for (const [timerName, timerInfo] of Object.entries(savedTimers)) {
        try {
          validateTimerInfo(timerInfo);
          this.#savedTimers[timerName] = deepFreeze(timerInfo);

          if (timerName in this.#invalidSavedTimers)
            delete this.#invalidSavedTimers[timerName];
        } catch (ex) {
          this.#invalidSavedTimers[timerName] = deepFreeze(timerInfo);

          if (timerName in this.#savedTimers)
            delete this.#savedTimers[timerName];

          await this.#errorLogger.log(ex);
          await notify(`Invalid saved timer "${timerName}". ${ex.message}`);
        }
      }
    }

    async saveTimer({ timerInfo, isTrusted = false }) {
      if (timerInfo.name in this.#savedTimers)
        throw new EPP(
          `Timer with name "${timerInfo.name}" already exists in saved timers.`,
          "TIMER_EXISTS"
        );
      if (timerInfo.name in this.#invalidSavedTimers)
        throw new EPP(
          `An invalid timer with name "${timerInfo.name}" already exists, delete it first.`,
          "INVALID_TIMER_EXISTS"
        );

      if (!isTrusted) {
        assertNonNullObject({
          object: timerInfo,
          name: "timerInfo",
          errorCode: "INVALID_TIMER_INFO",
        });

        timerInfo = validateTimerInfo(timerInfo);
      }

      this.#savedTimers[timerInfo.name] = timerInfo;

      await this.#writeConfigFile();
    }

    async deleteSavedTimer(timerName) {
      if (timerName in this.#savedTimers) delete this.#savedTimers[timerName];
      else if (timerName in this.#invalidSavedTimers)
        delete this.#invalidSavedTimers[timerName];
      else
        throw new EPP(
          `No saved timer exists for: "${timerName}"`,
          "TIMER_DOES_NOT_EXISTS"
        );

      await this.#writeConfigFile();
    }

    /**
     * @returns {{
     *  beepDuration: number,
     *  savedTimers: { [key: string]: {name: string, duration: number, description: string} },
     * }}
     * */
    async getConfig() {
      const config = {
        beepDuration: this.#beepDuration,
        savedTimers: { ...this.#savedTimers },
      };

      return deepFreeze(config);
    }

    async updateConfig() {
      await this.#readConfigFile();
    }

    #validateBeepDuration(duration) {
      if (
        typeof duration !== "number" ||
        !Number.isInteger(duration) ||
        duration < MIN_BEEP_DURATION ||
        duration > MAX_BEEP_DURATION
      )
        throw new EPP(
          `Beep duration must be an integer within range ${MIN_BEEP_DURATION}ms to ${MAX_BEEP_DURATION}ms`,
          "INVALID_BEEP_DURATION"
        );
    }
  };
};
