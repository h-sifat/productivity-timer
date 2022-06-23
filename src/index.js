const fs = require("fs");
const makeInitApplication = require("./makeInitApplication");
const IPCServer = require("./server");
const timerManager = require("./timer_manager");
const { SOCKET_PIPE_PATH, serverRoutes } = require("./config/configVariables");

const server = new IPCServer();

const initApplication = makeInitApplication({
  fs,
  server,
  timerManager,
  serverRoutes,
  SOCKET_PIPE_PATH,
});

initApplication();
