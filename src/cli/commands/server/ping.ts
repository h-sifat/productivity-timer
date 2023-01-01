import { formatString, isServerRunning } from "cli/util";

export async function pingServer() {
  if (await isServerRunning())
    console.log(formatString({ string: "Server is running", color: "green" }));
  else
    console.log(
      formatString({ string: "Server is not running", color: "red" })
    );
}
