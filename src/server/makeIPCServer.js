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
        connection.write(makeStringifiedResponse({ error: "Server busy." }));
        connection.destroy();
      }

      this.#currentConnection = connection;

      connection.on("data", (data) => {
        data = data.toString();

        let requestObject;
        try {
          requestObject = parseAndValidateRequestData(data);
        } catch (ex) {
          connection.write(makeStringifiedResponse({ error: ex.message }));
          connection.destroy();
        }

        const { path, body } = requestObject;

        if (path in this.#handlers)
          this.#handlers[path]({
            body,
            send: ({ error, body }) => {
              try {
                connection.write(makeStringifiedResponse({ error, body }));
              } catch (ex) {
                throw ex;
              } finally {
                connection.destroy();
                this.#currentConnection = null;
              }
            },
          });
        else {
          connection.write(
            makeStringifiedResponse({ error: `Invalid path: "${path}"` })
          );
          connection.destroy();
          this.#currentConnection = null;
        }

        // pass data to request handler
      });

      connection.on("error", (error) => {
        try {
          connection.write(makeStringifiedResponse({ error }));
        } catch {}
        connection.destroy();
        this.#server.close();
        this.#currentConnection = null;
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
