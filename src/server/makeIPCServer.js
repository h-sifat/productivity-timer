module.exports = function makeIPCServer({
  net,
  assertString,
  assertFunction,
  assertPlainObject,
}) {
  return class IPCServer {
    static #usedSocketPaths = new Set();

    #server;
    #handlers = {};
    #currentConnection = null;

    #onHandlerException = async () => {};

    constructor() {
      this.#server = net.createServer(this.#connectionHandler);
    }

    handle({ path, handler }) {
      assertString({ value: path, name: "requestPath" });
      assertFunction({ value: handler, name: "requestHandler" });

      if (path in this.#handlers)
        throw new Error(`A handler for path "${path}" is already registered.`);

      this.#handlers[path] = handler;
    }

    #connectionHandler = (connection) => {
      if (this.#currentConnection) {
        try {
          connection.write(makeStringifiedResponse({ error: "Server busy." }));
        } catch (ex) {}
        this.#destroyAndDeleteCurrentConnection();
      }

      this.#currentConnection = connection;

      connection.on("data", async (data) => {
        data = data.toString();

        const { path, body } = await this.#errorHandler({
          funcToExecute: () => parseAndValidateRequestData(data),
          onError: (ex) =>
            connection.write(makeStringifiedResponse({ error: ex.message })),
        });

        if (!(path in this.#handlers))
          await this.#errorHandler({
            funcToExecute: () => {
              const message = `Invalid path: "${path}"`;
              const response = makeStringifiedResponse({ error: { message } });
              connection.write(response);
            },
          });

        // the handler could be async. that's why the await

        const sendMethod = ({ error, body } = {}) => {
          try {
            connection.write(makeStringifiedResponse({ error, body }));
          } catch {
          } finally {
            this.#destroyAndDeleteCurrentConnection();
          }
        };

        const executeHandler = async () => {
          await this.#handlers[path]({ body, send: sendMethod });
        };

        await this.#errorHandler({
          funcToExecute: executeHandler,
          onError: async (ex) => {
            await this.#onHandlerException({ error: ex, path, body });
            const errorResponse = makeStringifiedResponse({
              error: { message: "Internal server error." },
            });

            try {
              connection.write(errorResponse);
            } catch {}
          },
        });
      });

      connection.on("error", (error) => {
        this.#errorHandler({
          funcToExecute: () =>
            connection.write(makeStringifiedResponse({ error })),
        });
      });
    };

    listen({ socketPath, callback = () => {} } = {}) {
      if (typeof socketPath !== "string")
        throw new Error(`Invalid socket path: "${socketPath}"`);
      if (IPCServer.#usedSocketPaths.has(socketPath))
        throw new Error(`The socket path "${socketPath}" is already in use.`);

      this.#server.listen(socketPath, callback);
    }

    close() {
      this.#server.close();
    }

    #errorHandler = async ({
      funcToExecute,
      throwError = false,
      onError = async () => {},
    }) => {
      try {
        return await funcToExecute();
      } catch (ex) {
        try {
          await onError(ex);
        } catch (ex) {}

        this.#destroyAndDeleteCurrentConnection();
        if (throwError) throw ex;
      }
    };

    #destroyAndDeleteCurrentConnection = () => {
      if (!this.#currentConnection) return;

      this.#currentConnection.destroy();
      this.#currentConnection = null;
    };

    set onHandlerException(func) {
      if (typeof func !== "function")
        throw new EPP(
          `IPCServer.onHandlerException must be a function.`,
          "INVALID_ARGUMENT"
        );

      this.#onHandlerException = func;
    }
  };

  function parseAndValidateRequestData(data) {
    const { path, body } = JSON.parse(data);

    assertString({ value: path, name: "path" });
    assertPlainObject({ object: body, name: "body" });

    return { path, body };
  }

  function makeStringifiedResponse({ body = null, error = null } = {}) {
    return JSON.stringify({ body, error });
  }
};
