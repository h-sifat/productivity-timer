module.exports = function makeConfigManager({
  fsp,
  EPP,
  path,
  exists,
  deepFreeze,
  MS_IN_ONE_SECOND,
  validateTimerInfo,
  assertNonNullObject,
  mkdirIfDoesNotExist,
}) {
  const MIN_BEEP_DURATION = MS_IN_ONE_SECOND;
  const MAX_BEEP_DURATION = 2 * 60 * MS_IN_ONE_SECOND; // 2 minutes
  const LOGS_DIR_NAME = "logs";
  const ERRORS_DIR_NAME = "errors";
  const TIMER_DIR_NAME = ".p_timer";
  const CONFIG_FILE_NAME = "config.json";

  const TIMER_DIR_PATH = path.join(process.env.HOME, TIMER_DIR_NAME);
  const TIMER_LOGS_DIR_PATH = path.join(TIMER_DIR_PATH, LOGS_DIR_NAME);
  const ERROR_LOGS_DIR_PATH = path.join(TIMER_DIR_PATH, ERRORS_DIR_NAME);
  const CONFIG_FILE_PATH = path.join(TIMER_DIR_PATH, CONFIG_FILE_NAME);

  /**
   * A singleton that manages all configurations
   * */
  return class ConfigManager {
    #savedTimers = {};
    #beepDuration = 10_000;

    /**
     * @type {{
     *    ROOT_DIR: string;
     *    TIMER_LOGS_DIR: string;
     *    ERROR_LOGS_DIR: string;
     * }}
     */
    #constants = Object.freeze({
      ROOT_DIR: TIMER_DIR_PATH,
      TIMER_LOGS_DIR: TIMER_LOGS_DIR_PATH,
      ERROR_LOGS_DIR: ERROR_LOGS_DIR_PATH,
    });

    #isInitiated = false;

    static #instance = null;
    constructor() {
      if (ConfigManager.#instance) return ConfigManager.#instance;
      ConfigManager.#instance = this;
    }

    async init() {
      if (this.#isInitiated) return;

      await mkdirIfDoesNotExist({ dir: TIMER_DIR_PATH });

      if (await exists(CONFIG_FILE_PATH)) this.#readConfigFile();
      else this.#writeConfigFile();

      this.#isInitiated = true;
    }

    async setBeepDuration(durationMS) {
      if (
        !Number.isInteger(durationMS) ||
        durationMS < MIN_BEEP_DURATION ||
        durationMS > MAX_BEEP_DURATION
      )
        throw new EPP(
          `Invalid beep duration: ${durationMS}. It must be an integer >= ${MIN_BEEP_DURATION}ms and <= ${MAX_BEEP_DURATION}ms`,
          "INVALID_BEEP_DURATION"
        );
      this.#beepDuration = durationMS;

      this.#writeConfigFile();
    }

    async #writeConfigFile() {
      const serializedConfig = JSON.stringify({
        savedTimers: this.#savedTimers,
        beepDuration: this.#beepDuration,
      });

      try {
        await fsp.writeFile(CONFIG_FILE_PATH, serializedConfig, "utf8");
      } catch (ex) {
        // @TODO notify
        throw ex;
      }
    }

    async #readConfigFile() {
      try {
        const serializedConfig = await fsp.readFile(CONFIG_FILE_PATH, "utf8");

        // @TODO validate configObject
        const { beepDuration, savedTimers } = JSON.parse(serializedConfig);

        this.#beepDuration = beepDuration;

        for (const timerName in savedTimers)
          this.#savedTimers[timerName] = deepFreeze(savedTimers[timerName]);
      } catch (ex) {}
    }

    async saveTimer(arg) {
      assertNonNullObject({
        object: arg,
        name: "timerInfo",
        errorCode: "INVALID_TIMER_INFO",
      });

      const { name, description, duration } = validateTimerInfo(arg);

      if (name in this.#savedTimers)
        throw new EPP(
          `A timer with name "${name}" already exists in saved timers.`,
          "TIMER_EXISTS"
        );
      this.#savedTimers[name] = { name, description, duration };

      await this.#writeConfigFile();
    }

    async deleteSavedTimer(name) {
      if (!(name in this.#savedTimers))
        throw new EPP(
          `No saved timer exist with the name: "${name}"`,
          "TIMER_DOES_NOT_EXISTS"
        );

      delete this.#savedTimers[name];

      await this.#writeConfigFile();
    }

    /**
     * @returns {{
     *  beepDuration: number,
     *  savedTimers: { [key: string]: {name: string, duration: number, description: string} },
     * }}
     * */
    async getConfig() {
      await this.#readConfigFile();

      const config = {
        beepDuration: this.#beepDuration,
        savedTimers: { ...this.#savedTimers },
      };

      return deepFreeze(config);
    }

    get constants() {
      return this.#constants;
    }
  };
};
