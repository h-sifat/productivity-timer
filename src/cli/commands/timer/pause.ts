import type { Command } from "commander";
import { withClient } from "cli/util/client";
import { TimerService } from "client/services/timer";
import { printTimerMethodCallResult } from "cli/util/timer";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";

export function addPauseTimerCommand(program: Command) {
  program
    .command("pause")
    .description("Pauses the currently running timer.")
    .alias("p")
    .action(pauseTimer);
}

async function pauseTimer() {
  await withClient(async (client) => {
    const timerService = new TimerService({
      client,
      url: config.API_TIMER_PATH,
    });

    const data = await timerService.pause();
    printTimerMethodCallResult(data);
  });
}
