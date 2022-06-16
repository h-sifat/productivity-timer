module.exports = function buildRequestToIPCServer({
  net,
  EPP,
  assertString,
  assertPlainObject,
}) {
  return function requestToIPCServer({ socketPath, path, body }) {
    assertString({ value: path, name: "request path" });
    assertString({ value: socketPath, name: "socketPath" });
    assertPlainObject({ object: body, name: "request body" });

    const serializedRequest = JSON.stringify({ path, body });

    return new Promise((resolve, reject) => {
      const client = net.createConnection({ path: "../../trash/socket" });

      client.on("connect", () => {
        client.write(serializedRequest);
      });

      client.on("data", (data) => {
        client.destroy();
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (ex) {
          const invalidResponseError = new EPP(
            `Invalid response from server.`,
            "INVALID_RESPONSE",
            { originalError: ex }
          );
          reject(invalidResponseError);
        }
      });

      client.on("end", () => {
        reject(new Error(`Connection ended by server.`));
      });

      client.on("error", (err) => reject(err));
    });
  };
};
