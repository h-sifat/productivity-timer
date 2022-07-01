module.exports = function makeCliApp(arg) {
  const {
    serverRoutes,
    SOCKET_PIPE_PATH,
    printErrorAndExit,
    buildCommandObject,
    requestToIPCServer,
    parseCommandLineArgs,
  } = arg;

  return async function cliApp({ cliArguments }) {
    const parsedArguments = parseCommandLineArgs(cliArguments);
    const commandObject = buildCommandObject(parsedArguments);

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
