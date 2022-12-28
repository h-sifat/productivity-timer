import colors from "ansi-colors";
import { Client } from "express-ipc";
import { InvalidArgumentError } from "commander";
import { API_AND_SERVER_CONFIG as config, CLI_NAME } from "src/config/other";

export function durationParser(value: any) {
  if (!/^\d+[hms]$/.test(String(value)))
    throw new InvalidArgumentError(
      "Invalid duration. Valid examples: 1h, 20m, 50s etc."
    );

  return "parsed duration";
}

export function formatStr(arg: { string: string; color: "green" | "red" }) {
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
