import colors from "ansi-colors";
import { Client } from "express-ipc";
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
