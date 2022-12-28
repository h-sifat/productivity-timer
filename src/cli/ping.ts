import { formatStr, isServerRunning } from "./util";

export async function ping() {
  if (await isServerRunning())
    console.log(formatStr({ string: "Server is running", color: "green" }));
  else
    console.log(formatStr({ string: "Server is not running", color: "red" }));
}
