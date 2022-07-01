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
});

const cliArguments = process.argv.slice(2);
cliApp({ cliArguments });
