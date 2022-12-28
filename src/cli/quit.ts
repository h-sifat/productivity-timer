import { Client } from "express-ipc";
import { getConfig } from "src/config";

export async function quit() {
  const config = getConfig();

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
    process.exit(0);
  }

  process.exit(0);
}
