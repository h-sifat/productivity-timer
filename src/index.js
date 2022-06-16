const fs = require("fs");
const makeInitApplication = require("./makeInitApplication");
const IPCServer = require("./server");
const timerManager = require("./timer_manager");
const { SOCKET_PIPE_PATH } = require("./config");

const server = new IPCServer();

const initApplication = makeInitApplication({
  fs,
  server,
  timerManager,
  SOCKET_PIPE_PATH,
});

initApplication();
