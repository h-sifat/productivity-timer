const __SqliteDb__ = require("./sqlite");
const ERROR_PROPERTIES = Object.freeze(["message", "code", "stack"]);

const db = new __SqliteDb__();

process.on("message", async (command) => {
  const { method, argument } = command;

  let response;

  try {
    const result = await db[method](argument);
    response = { error: null, result };
  } catch (ex) {
    response = { result: null, error: parseError(ex) };
  }

  process.send(response);
});

function parseError(originalError) {
  const error = {};

  for (const prop of ERROR_PROPERTIES)
    if (prop in originalError) error[prop] = originalError[prop];

  return error;
}
