import type { Command } from "commander";
import { withClient } from "cli/util/client";
import { TimerService } from "client/services/timer";
import { printTimerMethodCallResult } from "cli/util/timer";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";

export function addEndTimerCommand(program: Command) {
  program
    .command("end")
    .description("Ends the currently running timer.")
    .alias("stop")
    .option("--json", "print raw JSON.")
    .action(endTimer);
}

type Options = {
  json?: boolean;
};

async function endTimer(options: Options) {
  await withClient(async (client) => {
    const timerService = new TimerService({
      client,
      url: config.API_TIMER_PATH,
    });

    const data = await timerService.end();
    if (options.json) return console.log(JSON.stringify(data));

    await printTimerMethodCallResult(data);
  });
}
