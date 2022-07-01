// import the configVariables module before anyone else and get the accessKey
// as soon as possible.
const configVariables = require("./config/configVariables");
{
  // now as we've the configVariablesAccessKey we can modify any config variables
  // and no other module will be able to get this access anymore after this
  // first call.
  const configVariablesAccessKey = configVariables.__getAccessKey__();
}

const fs = require("fs");
const makeApplication = require("./makeApplication");
const IPCServer = require("./server");
const timerManager = require("./timer_manager");
const { SOCKET_PIPE_PATH, serverRoutes } = require("./config/configVariables");

const server = new IPCServer();

const app = makeApplication({
  fs,
  server,
  timerManager,
  serverRoutes,
  SOCKET_PIPE_PATH,
});

// start the app
app();
