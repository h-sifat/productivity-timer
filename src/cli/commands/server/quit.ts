import { withClient } from "cli/util/client";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";

export async function quitServer() {
  await withClient(async (client) => {
    await client.post(config.API_APP_PATH, { body: { name: "quit" } } as any);
  });
}
