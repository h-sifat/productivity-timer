const assert = require("assert");

module.exports = function (content) {
  assert(content instanceof Buffer);
  return content;
};

module.exports.raw = true;
