import { Client } from "express-ipc";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";

export async function quit() {
  let client: Client;
  try {
    client = new Client({
      path: {
        id: config.SERVER_ID,
        namespace: config.SERVER_NAMESPACE,
      },
    });

    await client.post(config.API_APP_PATH, { body: { name: "quit" } } as any);
    client.close();
  } catch (ex) {
    console.log("Could not close the server. It's probably not running.");
  }

  process.exitCode = 0;
}