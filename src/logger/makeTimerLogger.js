module.exports = function makeTimerLogger({
  fs,
  EPP,
  fsp,
  path,
  exists,
  required,
  deepFreeze,
  isDatesEqual,
}) {
  return class TimerLogger {
    #logsDir;
    #currentLogFile;
    #currentDate = new Date();
    #cache = [];

    constructor(arg = {}) {
      const { logsDir = required("logsDir") } = arg;
      if (typeof logsDir !== "string" || !logsDir.length)
        throw new EPP(
          `Invalid logs directory: "${logsDir}"`,
          "INVALID_LOGS_DIR"
        );

      this.#logsDir = path.resolve(logsDir);
      this.#currentLogFile = this.#getLogFilePath(this.#currentDate);
    }

    async init() {
      if (await exists(this.#logsDir)) {
        const hasReadWritePermission = await exists(
          this.#logsDir,
          fs.constants.R_OK | fs.constants.W_OK // with read and write permission
        );

        if (!hasReadWritePermission)
          throw new EPP(
            `Logs directory "${this.#logsDir}" is not accessible.`,
            "LOGS_DIR_INACCESSIBLE"
          );
      } else {
        try {
          await fsp.mkdir(this.#logsDir, { recursive: true });
        } catch (ex) {
          throw new EPP(
            `Couldn't create logs directory: "${this.#logsDir}"`,
            "MAKE_LOGS_DIR_FAILED"
          );
        }
      }

      const logs = await this.#getLogsFromFile(this.#currentLogFile);

      this.#cache = logs.map(deepFreeze);
    }

    async getAllLogsOfToday() {
      this.#refreshDateAndLogFilePath();
      return await this.#getLogsFromFile(this.#currentLogFile);
    }

    async log(logObject) {
      this.#refreshDateAndLogFilePath();

      const stringifiedLog = JSON.stringify(logObject) + ",\n";
      // @TODO error handling and if deleted create the file again
      await fsp.appendFile(this.#currentLogFile, stringifiedLog, "utf8");

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
