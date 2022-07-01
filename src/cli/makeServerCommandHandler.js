module.exports = function makeServerCommandHandler(arg) {
  const {
    serverRoutes,
    SOCKET_PIPE_PATH,
    printErrorAndExit,
    requestToIPCServer,
  } = arg;

  return async function serverCommandHandler(commandObject) {
    const { arguments: _arguments } = commandObject;

    if (!_arguments.length)
      printErrorAndExit(`Missing server action argument.`);
    if (!_arguments.length > 1)
      printErrorAndExit(`Too many arguments for server command.`);

    const serverAction = _arguments[0].toUpperCase();

    switch (serverAction) {
      case "START":
        // @TODO add later
        break;
      case "KILL":
        return await killServer();
      case "REBOOT":
        // @TODO add later
        break;

      default:
        printErrorAndExit(`Invalid server action "${serverAction}"`);
    }
  };

  async function killServer() {
    if (await isServerAlive()) {
      await requestToIPCServer({
        socketPath: SOCKET_PIPE_PATH,
        requestPath: serverRoutes.KILL_SERVER,
      });
      console.log("Killed server X-(");
    } else printErrorAndExit("Server is not running.");
  }

  async function isServerAlive() {
    try {
      await requestToIPCServer({
        socketPath: SOCKET_PIPE_PATH,
        requestPath: serverRoutes.PING,
      });
      return true;
    } catch (ex) {
      return false;
    }
  }
};
