const net = require("net");
const buildRequestToIPCServer = require("./buildRequestToIPCServer");

const requestToIPCServer = buildRequestToIPCServer({ net });

module.exports = requestToIPCServer;
