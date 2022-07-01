module.exports = function makeCliApp(arg) {
  const {
    serverRoutes,
    SOCKET_PIPE_PATH,
    printErrorAndExit,
    buildCommandObject,
    requestToIPCServer,
    parseCommandLineArgs,
    getServerCommandHandler,
  } = arg;

  return async function cliApp({ cliArguments }) {
    const parsedArguments = parseCommandLineArgs(cliArguments);
    const commandObject = buildCommandObject(parsedArguments);

    if (commandObject.command === "server") {
      // lazy load this module to improve performance
      const serverCommandHandler = getServerCommandHandler();
      await serverCommandHandler(commandObject);
      return;
    }

    try {
      const response = await requestToIPCServer({
        body: commandObject,
        socketPath: SOCKET_PIPE_PATH,
        requestPath: serverRoutes.TIMER_MANAGER,
      });

      console.dir(response, { depth: null });
    } catch (ex) {
      const message =
        "Couldn't make request to server.\n" +
        `Is server running? Use "pt server start" to start the server.\n\n` +
        `[Error: ${ex.message}]`;
      printErrorAndExit(message);
    }
  };
};
