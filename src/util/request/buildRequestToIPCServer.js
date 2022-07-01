module.exports = function buildRequestToIPCServer({ net }) {
  return function requestToIPCServer({ socketPath, requestPath, body = {} }) {
    // ugly validation
    if (typeof socketPath !== "string" || socketPath === "")
      throw new Error(`Invalid socket path: "${socketPath}".`);
    if (typeof requestPath !== "string" || requestPath === "")
      throw new Error(`Invalid request path: "${requestPath}".`);
    if (typeof body !== "object" || body === null || Array.isArray(body))
      throw new Error(`Invalid body. Body must be a plain object.`);

    const serializedRequest = JSON.stringify({ path: requestPath, body });

    return new Promise((resolve, reject) => {
      const client = net.createConnection({ path: socketPath });

      client.on("connect", () => {
        client.write(serializedRequest);
      });

      client.on("data", (data) => {
        client.destroy();
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (ex) {
          const invalidResponseError = new Error(
            "Invalid response from server."
          );
          invalidResponseError.code = "INVALID_RESPONSE";
          invalidResponseError.originalError = ex;

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
