import colors from "ansi-colors";
import { Client } from "express-ipc";
import { printErrorAndSetExitCode } from ".";
import { API_AND_SERVER_CONFIG as config, CLI_NAME } from "src/config/other";

export async function withClient(
  callback: (client: Client) => Promise<void>,
  options: { onNotRunning?: (ex: Error) => void } = {}
) {
  let client: Client;
  try {
    client = new Client({
      path: {
        id: config.SERVER_ID,
        namespace: config.SERVER_NAMESPACE,
      },
    });

    await client.post(config.API_APP_PATH, {
      query: {},
      headers: {},
      body: { name: "ping" },
    });

    try {
      await callback(client);
    } catch (ex) {
      printErrorAndSetExitCode(ex);
    } finally {
      client.close();
    }
  } catch (ex) {
    client!.close();

    if (options.onNotRunning) {
      options.onNotRunning(ex);
      return;
    }

    console.error(colors.red("Could not connect to server."));
    console.error("Is the server running?");

    const startCommand = `${CLI_NAME} bootup`;
    console.error(`Use '${colors.inverse(startCommand)}' to start the server.`);

    console.error("Error:", ex.message);
    process.exit(1);
  }
}
