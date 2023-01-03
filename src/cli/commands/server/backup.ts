import { formatString } from "cli/util";
import { withClient } from "cli/util/client";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";

export async function backup() {
  await withClient(async (client) => {
    const { body } = (await client.post(config.API_APP_PATH, {
      query: {},
      headers: {},
      body: { name: "backup" },
    })) as any;

    if (!body.success) throw body.error;

    console.log(formatString({ string: body.data.message, color: "green" }));
  });
}
