module.exports = function makeApplication({
  fs,
  server,
  timerManager,
  serverRoutes,
  SOCKET_PIPE_PATH,
}) {
  server.handle({
    path: serverRoutes.TIMER_MANAGER,
    handler: async ({ body, send }) => {
      const result = await timerManager.execute(body);
      send({ body: result });
    },
  });

  server.handle({
    path: serverRoutes.KILL_SERVER,
    handler: async ({ send }) => {
      send({ body: { message: "Closing Server." } });

      try {
        // end any active timer
        await timerManager.execute({
          options: {},
          command: "END",
        });
      } catch {}

      server.close();
      process.exit(0);
    },
  });

  server.handle({
    path: serverRoutes.PING,
    handler: ({ send }) => {
      send({ body: { message: "I'm alive." } });
    },
  });

  server.onHandlerException = function onHandlerException({ error, path }) {
    console.error(`The handler for path: "${path}" threw an error.`, error);
  };

  return async function initApplication() {
    await timerManager.init();

    // before listening on the pipe, remove it so that it can be recreated if
    // it already exists
    await fs.promises.rm(SOCKET_PIPE_PATH, { force: true });

    server.listen({
      socketPath: SOCKET_PIPE_PATH,
      callback: () =>
        console.log(`server running on socket: "${SOCKET_PIPE_PATH}"`),
    });
  };
};
