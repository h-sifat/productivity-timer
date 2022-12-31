import { formatStr, isServerRunning } from "cli/util";

export async function pingServer() {
  if (await isServerRunning())
    console.log(formatStr({ string: "Server is running", color: "green" }));
  else
    console.log(formatStr({ string: "Server is not running", color: "red" }));
}
