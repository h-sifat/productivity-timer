const path = require("path");

const CONFIG = {
  baseDir: process.env.HOME,

  ERRORS_DIR_NAME: "errors",
  TIMER_DIR_NAME: ".p_timer",
  TIMER_LOGS_DIR_NAME: "logs",
  CONFIG_FILE_NAME: "config.json",
  SOCKET_PIPE_NAME: ".socket-pipe",
  serverRoutes: {
    PING: "/ping",
    KILL_SERVER: "/kill-server",
    TIMER_MANAGER: "/timer-manager",
  },
};

/*
 * Actually there is no important reason to make configVariables module this
 * complex but I just wanted to be able to change the logs directory while I'm
 * experimenting with this application (so it wouldn't mess with my real logs).
 * So I had to make all this variables mutable but that would be insecure
 * because then other modules would also be able to change everything! That's
 * why I'm using all this accessKey ceremony in this class.
 * */
const configVariables = new (class ConfigVariables {
  #configAccessKey = Symbol();
  #isAccessKeyGiven = false;

  __getAccessKey__() {
    if (this.#isAccessKeyGiven) return;

    this.#isAccessKeyGiven = true;
    return this.#configAccessKey;
  }

  __getRawConfig__(accessKey) {
    if (accessKey !== this.#configAccessKey) return;

    return CONFIG;
  }

  get TIMER_DIR_PATH() {
    return path.join(CONFIG.baseDir, CONFIG.TIMER_DIR_NAME);
  }
  get TIMER_LOGS_DIR_PATH() {
    return path.join(this.TIMER_DIR_PATH, CONFIG.TIMER_LOGS_DIR_NAME);
  }
  get ERROR_LOGS_DIR_PATH() {
    return path.join(this.TIMER_DIR_PATH, CONFIG.ERRORS_DIR_NAME);
  }
  get CONFIG_FILE_PATH() {
    return path.join(this.TIMER_DIR_PATH, CONFIG.CONFIG_FILE_NAME);
  }
  get SOCKET_PIPE_PATH() {
    return path.join(this.TIMER_DIR_PATH, CONFIG.SOCKET_PIPE_NAME);
  }
  get serverRoutes() {
    return Object.freeze({ ...CONFIG.serverRoutes });
  }
})();

module.exports = configVariables;
