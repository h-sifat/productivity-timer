const path = require("path");
const { spawn } = require("child_process");
const { required } = require("../util/required");

module.exports = function spawnDetachedProcess(arg = {}) {
  const { modulePath = required("modulePath") } = arg;
  const moduleDir = path.dirname(modulePath);

  const subprocess = spawn(process.argv[0], [modulePath], {
    cwd: moduleDir,
    detached: true,
    stdio: "ignore",
  });

  subprocess.unref();
};
