import type { Command } from "commander";
import { withClient } from "cli/util/client";
import { printTimerMethodCallResult } from "cli/util/timer";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";

export function addPauseTimerCommand(program: Command) {
  program
    .command("pause")
    .description("Pauses the currently running timer.")
    .action(pauseTimer);
}

async function pauseTimer() {
  await withClient(async (client) => {
    const { body } = (await client.post(config.API_TIMER_PATH, {
      query: {},
      headers: {},
      body: { name: "pause" },
    })) as any;

    if (!body.success) throw body.error;

    printTimerMethodCallResult(body.data);
  });
}
