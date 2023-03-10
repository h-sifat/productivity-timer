import type { Command } from "commander";
import { withClient } from "cli/util/client";
import { TimerService } from "client/services/timer";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";
import { DurationOption, printTimerMethodCallResult } from "cli/util/timer";

export function addResetTimerCommand(program: Command) {
  program
    .command("reset")
    .alias("rst")
    .description("Resets the countdown timer.")
    .option("-h, --hard-reset", "resets the category/project reference", false)
    .addOption(DurationOption)
    .action(resetTimer);
}

interface resetTimer_Options {
  duration?: number;
  hardReset?: boolean;
}

export async function resetTimer(options: resetTimer_Options) {
  await withClient(async (client) => {
    const timerService = new TimerService({
      client,
      url: config.API_TIMER_PATH,
    });

    const data = await timerService.reset(options);
    printTimerMethodCallResult(data);
  });
}
