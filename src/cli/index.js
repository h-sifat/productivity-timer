#!/usr/bin/env node

const requestToIPCServer = require("../util/request");
const printErrorAndExit = require("../util/printErrorAndExit");
const parseCommandLineArgs = require("../util/parseCommandLineArgs");

const { SOCKET_PIPE_PATH, serverRoutes } = require("../config/configVariables");

main();

async function main() {
  const commandLineArguments = process.argv.slice(2);

  const parsedArguments = parseCommandLineArgs(commandLineArguments);
  const commandObject = buildCommandObject(parsedArguments);

  try {
    const response = await requestToIPCServer({
      body: commandObject,
      socketPath: SOCKET_PIPE_PATH,
      requestPath: serverRoutes.TIMER_MANAGER,
    });

    console.dir(response, { depth: null });
  } catch (ex) {
    printErrorAndExit(
      `Couldn't make request to server. [Error: ${ex.message}]`
    );
  }
}

function buildCommandObject(parsedCommandLineArgs) {
  const { arguments: _arguments, options } = parsedCommandLineArgs;

  if (!_arguments.length)
    printErrorAndExit(
      `At least one sub command (create, start, etc.) is required.`
    );

  const command = _arguments.shift();
  return { options, command, arguments: _arguments };
}
