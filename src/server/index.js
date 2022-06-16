const net = require("net");
const { assertPlainObject, assertString, assertFunction } = require("../util");
const makeIPCServer = require("./makeIPCServer");

const IPCServer = makeIPCServer({
  net,
  assertString,
  assertFunction,
  assertPlainObject,
});

module.exports = IPCServer;
