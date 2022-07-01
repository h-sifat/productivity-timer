#!/usr/bin/env node

const makeCliApp = require("./makeCliApp");
const requestToIPCServer = require("../util/request");
const parseCommandLineArgs = require("../util/parseCommandLineArgs");
const { printErrorAndExit, buildCommandObject } = require("./cliUtil");
const { serverRoutes, SOCKET_PIPE_PATH } = require("../config/configVariables");

const cliApp = makeCliApp({
  serverRoutes,
  SOCKET_PIPE_PATH,
  printErrorAndExit,
  buildCommandObject,
  requestToIPCServer,
  parseCommandLineArgs,
  getServerCommandHandler,
});

const cliArguments = process.argv.slice(2);
// start the cli app with the given arguments
cliApp({ cliArguments });

function getServerCommandHandler() {
  const path = require("path");
  const SERVER_APPLICATION_MODULE_PATH = path.resolve(__dirname, "../index.js");

  return require("./makeServerCommandHandler")({
    serverRoutes,
    SOCKET_PIPE_PATH,
    printErrorAndExit,
    requestToIPCServer,
    SERVER_APPLICATION_MODULE_PATH,
    getSpawnDetachedProcess: () => require("./spawnDetachedProcess"),
  });
}
