import colors from "ansi-colors";
import { Client } from "express-ipc";
import { InvalidArgumentError } from "commander";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";
import { assertValidUSLocaleDateString } from "common/util/date-time";

export { printObjectAsBox } from "./box";

export function durationParser(value: any) {
  if (!/^\d+[hms]$/.test(String(value)))
    throw new InvalidArgumentError(
      "Invalid duration. Valid examples: 1h, 20m, 50s etc."
    );

  return "parsed duration";
}

export function formatStr(arg: {
  string: string;
  color: "green" | "red" | "yellow" | "grey";
}) {
  const { string, color } = arg;
  return colors[color](string);
}

export async function isServerRunning() {
  let client: Client;

  try {
    client = new Client({
      path: {
        id: config.SERVER_ID,
        namespace: config.SERVER_NAMESPACE,
      },
    });

    await client.post(config.API_APP_PATH, {
      body: { name: "ping" },
    } as any);

    return true;
  } catch (ex) {
    return false;
  } finally {
    if (client!) client.close();
  }
}

export function dateStringParser(dateString: string) {
  try {
    assertValidUSLocaleDateString(dateString);
  } catch (ex) {
    throw new InvalidArgumentError(ex.message);
  }

  return new Date(dateString).valueOf();
}

export function printErrorAndSetExitCode(ex: any) {
  const message = `Error: ${ex.message}`;
  console.log(formatStr({ string: message, color: "red" }));
  process.exitCode = 1;
}

export interface formatDateProperties_Arg {
  object: any;
  dateProperties: string[];
  type?: "date-time" | "date";
}

export function formatDateProperties<T>(arg: formatDateProperties_Arg): T {
  const { object, dateProperties, type = "date-time" } = arg;

  const methods = {
    date: "toLocaleDateString",
    "date-time": "toLocaleString",
  } as const;

  dateProperties.forEach((prop) => {
    if (object[prop]) object[prop] = new Date(object[prop])[methods[type]]();
  });

  return object;
}
