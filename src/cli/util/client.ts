import colors from "ansi-colors";
import { Client } from "express-ipc";
import { printErrorAndSetExitCode } from ".";
import { API_AND_SERVER_CONFIG as config, CLI_NAME } from "src/config/other";

export async function withClient(callback: (client: Client) => Promise<void>) {
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
      console.log(colors.red(message));

      client.close();
      process.exit(1);
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

    console.log(colors.red("Could not connect to server."));
    console.log("Is the server running?");

    const startCommand = `${CLI_NAME} bootup`;
    console.log(`Use '${colors.inverse(startCommand)}' to start the server.`);

    console.log("Error:", ex.message);
    process.exit(1);
  }
}
