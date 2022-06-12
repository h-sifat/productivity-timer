module.exports = function makeLogger({
  EPP,
  fsp,
  path,
  notify,
  required,
  deepFreeze,
  isDatesEqual,
  mkdirIfDoesNotExist,
}) {
  return class Logger {
    #logsDir;
    #cache = [];
    #currentLogFile;
    #currentDate = new Date();
    #logObjectNormalizer = (logObject) => logObject;
    #ignoreLoggingFailure;

    constructor(arg = {}) {
      const {
        logObjectNormalizer,
        ignoreLoggingFailure = false,
        logsDir = required("logsDir"),
      } = arg;

      if (typeof logsDir !== "string" || !logsDir.length)
        throw new EPP(
          `Invalid logs directory: "${logsDir}"`,
          "INVALID_LOGS_DIR"
        );

      if (logObjectNormalizer) {
        if (typeof logObjectNormalizer !== "function")
          throw new EPP(
            `Log object normalizer must be of type function.`,
            "INVALID_LOG_OBJECT_NORMALIZER"
          );

        this.#logObjectNormalizer = logObjectNormalizer;
      }

      this.#logsDir = path.resolve(logsDir);
      this.#currentLogFile = this.#getLogFilePath(this.#currentDate);
      this.#ignoreLoggingFailure = ignoreLoggingFailure;
    }

    async init() {
      try {
        await mkdirIfDoesNotExist({ dir: this.#logsDir });
      } catch (ex) {
        await notify(`Couldn't create logs dir: "${this.#logsDir}"`);
        throw ex;
      }

      const logs = await this.#getLogsFromFile(this.#currentLogFile);
      this.#cache = logs.map(deepFreeze);
    }

    async getLogs(date) {
      if (!date) {
        this.#refreshDateAndLogFilePath();
        return await this.#getLogsFromFile(this.#currentLogFile);
      }

      const logFilePath = this.#getLogFilePath(date);
      return await this.#getLogsFromFile(logFilePath);
    }

    async log(logObject) {
      this.#refreshDateAndLogFilePath();

      logObject = this.#logObjectNormalizer(logObject);

      /*
       * adding ",\n" will let us parse the log file as a JSON array
       * Example:
       *
       * log_file:
       * +--------+
       * |{"a":1},|
       * |{"b":2},|
       * +--------+
       *
       * then if we remove the trailing ",\n" and add "[" and "]" respectively
       * before and after the file, we'll get:
       *
       * +---------+
       * |[{"a":1},|
       * |{"b":2}] |
       * +---------+
       * Now we can use JSON.parse() on the file.
       * */
      const stringifiedLog = JSON.stringify(logObject) + ",\n";

      try {
        await fsp.appendFile(this.#currentLogFile, stringifiedLog, "utf8");
      } catch (ex) {
        await notify(ex.message);
        if (!this.#ignoreLoggingFailure) throw ex;
      }

      this.#cache.push(logObject);
    }

    #refreshDateAndLogFilePath() {
      if (isDatesEqual(this.#currentDate, new Date())) return;

      this.#currentDate = new Date();
      this.#cache = [];

      this.#currentLogFile = this.#getLogFilePath(this.#currentDate);
    }

    #getLogFilePath(date) {
      const filename = this.#dateToFileName(date);
      return path.join(this.#logsDir, filename);
    }

    #dateToFileName(date) {
      return date.toLocaleDateString().replace(/\//g, "-");
    }

    async #getLogsFromFile(filepath) {
      let rawLogData;
      try {
        rawLogData = await fsp.readFile(filepath);
      } catch (ex) {
        if (ex.code === "ENOENT") return [];
        throw ex;
      }

      try {
        // --------------|  remove trailing ",\n"  |-------
        rawLogData = "[" + rawLogData.slice(0, -2) + "]";
        return JSON.parse(rawLogData);
      } catch (ex) {
        throw new Error(`The log file "${filepath}" is corrupted.`);
      }
    }
  };
};
