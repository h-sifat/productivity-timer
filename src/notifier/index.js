const util = require("util");
const exec = util.promisify(require("child_process").exec);

async function notify(text) {
  await exec(`notify-send '${text}'`);
}

module.exports = notify;
