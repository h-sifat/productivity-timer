import type { Command } from "commander";
import { withClient } from "cli/util/client";
import { TimerService } from "client/services/timer";
import { printTimerMethodCallResult } from "cli/util/timer";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";

export function addRestartTimerCommand(program: Command) {
  program
    .command("restart")
    .description("Resets and starts the current timer.")
    .alias("r")
    .option("--json", "print raw JSON.")
    .action(restartTimer);
}

type Options = {
  json?: boolean;
};

export async function restartTimer(options: Options) {
  await withClient(async (client) => {
    const timerService = new TimerService({
      client,
      url: config.API_TIMER_PATH,
    });

    await timerService.reset();
    const data = await timerService.start();
    if (options.json) return console.log(JSON.stringify(data));

    await printTimerMethodCallResult(data);
  });
}
