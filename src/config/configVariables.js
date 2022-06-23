const path = require("path");

const TIMER_LOGS_DIR_NAME = "logs";
const ERRORS_DIR_NAME = "errors";
const TIMER_DIR_NAME = ".p_timer";
const CONFIG_FILE_NAME = "config.json";
const SOCKET_PIPE_NAME = ".socket-pipe";

const TIMER_DIR_PATH = path.join(process.env.HOME, TIMER_DIR_NAME);
const TIMER_LOGS_DIR_PATH = path.join(TIMER_DIR_PATH, TIMER_LOGS_DIR_NAME);
const ERROR_LOGS_DIR_PATH = path.join(TIMER_DIR_PATH, ERRORS_DIR_NAME);
const CONFIG_FILE_PATH = path.join(TIMER_DIR_PATH, CONFIG_FILE_NAME);
const SOCKET_PIPE_PATH = path.join(TIMER_DIR_PATH, SOCKET_PIPE_NAME);

const serverRoutes = Object.freeze({
  TIMER_MANAGER: "/timer-manager",
});

module.exports = {
  serverRoutes,
  TIMER_DIR_PATH,
  CONFIG_FILE_PATH,
  SOCKET_PIPE_PATH,
  TIMER_LOGS_DIR_PATH,
  ERROR_LOGS_DIR_PATH,
};
