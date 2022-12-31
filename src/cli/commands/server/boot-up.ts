import path from "path";
import { fork } from "child_process";
import { log } from "src/start-up/util";
import { isServerRunning } from "cli/util";

export async function bootupServer() {
  if (await isServerRunning())
    console.log("Server is already running. Ping to verify.");
  else
    spawnDetachedProcess({
      modulePath: path.join(__dirname, __SERVER_FILE_NAME__),
    });
}

function spawnDetachedProcess(arg: { modulePath: string }) {
  const { modulePath } = arg;
  const moduleDir = path.dirname(arg.modulePath);

  const subprocess = fork(modulePath, {
    cwd: moduleDir,
    detached: true,
    stdio: "ignore",
  });

  function messageHandler(arg: any) {
    switch (arg.type) {
      case "log":
        console.log(arg.message);
        break;

      case "start-up":
        if (arg.success) {
          subprocess.removeAllListeners("message");
          subprocess.disconnect();
          subprocess.unref();
        } else {
          subprocess.kill();
          subprocess.removeAllListeners("message");
          process.exitCode = 1;
        }
        break;

      default:
        log({
          type: "fatal_error",
          message: `Server has sent invalid message!`,
        });
        subprocess.kill();
        subprocess.removeAllListeners("message");
        process.exitCode = 1;
    }
  }

  subprocess.on("message", messageHandler);
}
