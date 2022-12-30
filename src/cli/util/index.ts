import colors from "ansi-colors";
import { Client } from "express-ipc";
import { dynamicImport } from "./import";
import { InvalidArgumentError } from "commander";
import { assertValidUSLocaleDateString } from "common/util/date-time";
import { API_AND_SERVER_CONFIG as config, CLI_NAME } from "src/config/other";

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

export async function getClient(): Promise<Client> {
  let client: Client;
  try {
    client = new Client({
      path: {
        id: config.SERVER_ID,
        namespace: config.SERVER_NAMESPACE,
      },
    });

    client.on("error", (error) => {
      const message = error.message || "An unexpected error ocurred.";
      console.log(formatStr({ color: "red", string: message }));

      client.close();
      process.exit(1);
    });

    await client.post(config.API_APP_PATH, {
      query: {},
      headers: {},
      body: { name: "ping" },
    });

    return client;
  } catch (ex) {
    client!.close();

    console.log(colors.red("Could not connect to server."));
    console.log("Is the server running?");

    const startCommand = `${CLI_NAME} bootup`;
    console.log(`Use '${colors.inverse(startCommand)}' to start the server.`);

    console.log("Error:", ex.message);
    process.exit(1);
  }
}

export function printErrorAndSetExitCode(ex: any) {
  const message = `Error: ${ex.message}`;
  console.log(formatStr({ string: message, color: "red" }));
  process.exitCode = 1;
}

export interface printObjectAsBox_Argument {
  object: object;
}

export async function printObjectAsBox(arg: printObjectAsBox_Argument) {
  const { object } = arg;

  const keyValuePair = Object.entries(object);
  const maxKeyNameLength = keyValuePair.reduce(
    (maxLength, [key]) => Math.max(maxLength, key.length),
    -Infinity
  );

  keyValuePair.sort(
    ([_kA, vA], [_kB, vB]) => String(vA).length - String(vB).length
  );

  let content = "";
  keyValuePair.forEach(([key, value], index) => {
    if (!value) return;

    if (index) content += "\n";
    content += `${colors.green(key + ": ")}${" ".repeat(
      maxKeyNameLength - key.length
    )}${colors.white(String(value))}`;
  });

  const { default: boxen } = await dynamicImport("boxen");
  const box = boxen(content, {
    padding: 1,
    borderStyle: "round",
  });

  console.log(box);
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
