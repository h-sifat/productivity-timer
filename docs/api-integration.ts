import { Client } from "express-ipc/dist/client";
import { TimerService } from "../src/client/services/timer";
import { API_AND_SERVER_CONFIG, BROADCAST_CHANNELS } from "../src/config/other";

async function main() {
  const client = new Client({
    path: {
      id: "prod",
      namespace: API_AND_SERVER_CONFIG.SERVER_NAMESPACE,
    },
  });

  const timerService = new TimerService({
    client,
    url: API_AND_SERVER_CONFIG.API_TIMER_PATH,
  });

  console.log("timer info: ", await timerService.getInfo());

  // listening to timer broadcasts
  await client.subscribe(BROADCAST_CHANNELS.TIMER_BROADCAST_CHANNEL);

  client.on("broadcast", ({ channel, data }) => {
    console.log(`received broadcast in channel "${channel}" with data: `, data);
  });
}

main();
