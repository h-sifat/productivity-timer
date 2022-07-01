module.exports = function makeServerCommandHandler(arg) {
  const {
    serverRoutes,
    SOCKET_PIPE_PATH,
    printErrorAndExit,
    requestToIPCServer,
    getSpawnDetachedProcess,
    SERVER_APPLICATION_MODULE_PATH,
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
        return await startServer();
      case "KILL":
        return await killServer();
      case "PING":
        {
          try {
            const { body } = await pingServer();
            console.log(body.message);
          } catch (ex) {
            printErrorAndExit(`Error: ${ex.message}`);
          }
        }
        break;

      default:
        printErrorAndExit(`Invalid server action "${serverAction}"`);
    }
  };

  async function startServer() {
    if (await isServerAlive())
      return void printErrorAndExit("Server already running.");

    const spawnDetachedProcess = getSpawnDetachedProcess();
    spawnDetachedProcess({ modulePath: SERVER_APPLICATION_MODULE_PATH });

    console.log("Started Server. Now ping to verify!");
  }

  async function killServer() {
    if (await isServerAlive()) {
      await requestToIPCServer({
        socketPath: SOCKET_PIPE_PATH,
        requestPath: serverRoutes.KILL_SERVER,
      });
      console.log("Killed server X-(");
    } else printErrorAndExit("Server is not running.");
  }

  async function pingServer() {
    return await requestToIPCServer({
      socketPath: SOCKET_PIPE_PATH,
      requestPath: serverRoutes.PING,
    });
  }

  async function isServerAlive() {
    try {
      await pingServer();
      return true;
    } catch (ex) {
      return false;
    }
  }
};
