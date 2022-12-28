import { Client } from "express-ipc";
import colors from "ansi-colors";
import { getConfig } from "src/config";
import { InvalidArgumentError } from "commander";

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
  const config = getConfig();
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
