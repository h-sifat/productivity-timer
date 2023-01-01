import type { Command } from "commander";
import { withClient } from "cli/util/client";
import { printTimerMethodCallResult } from "cli/util/timer";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";

export function addTimerInfoCommand(program: Command) {
  program
    .command("info")
    .description("Shows the countdown timer information.")
    .action(showTimerInfo);
}

async function showTimerInfo() {
  await withClient(async (client) => {
    const { body } = (await client.post(config.API_TIMER_PATH, {
      query: {},
      headers: {},
      body: { name: "info" },
    })) as any;

    if (!body.success) throw body.error;

    const {
      state,
      duration,
      ref = null,
      elapsedTime,
      remainingTime,
    } = body.data;

    printTimerMethodCallResult({
      ref,
      state,
      timeInfo: { elapsedTime, duration, remainingTime },
    });
  });
}
