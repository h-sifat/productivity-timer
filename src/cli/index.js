#!/usr/bin/env node

const requestToIPCServer = require("../util/request");
const printErrorAndExit = require("../util/printErrorAndExit");
const parseCommandLineArgs = require("../util/parseCommandLineArgs");

const { SOCKET_PIPE_PATH } = require("../config/configVariables");

main();

async function main() {
  const commandLineArguments = process.argv.slice(2);

  const parsedArguments = parseCommandLineArgs(commandLineArguments);
  const commandObject = buildCommandObject(parsedArguments);

  const response = await requestToIPCServer({
    body: commandObject,
    requestPath: "/timer",
    socketPath: SOCKET_PIPE_PATH,
  });

  console.dir(response, { depth: null });
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
