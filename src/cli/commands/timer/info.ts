import type { Command } from "commander";
import { withClient } from "cli/util/client";
import { TimerService } from "client/services/timer";
import { printTimerMethodCallResult } from "cli/util/timer";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";

export function addTimerInfoCommand(program: Command) {
  program
    .command("info")
    .alias("i")
    .description("Shows the countdown timer information.")
    .option("--json", "print raw JSON.")
    .action(showTimerInfo);
}

interface showTimerInfoOptions {
  json?: boolean;
}

async function showTimerInfo(options: showTimerInfoOptions) {
  await withClient(async (client) => {
    const timerService = new TimerService({
      client,
      url: config.API_TIMER_PATH,
    });

    const data = await timerService.getInfo();
    if (options.json) return console.log(JSON.stringify(data));

    const { state, duration, ref = null, elapsedTime, remainingTime } = data;
    await printTimerMethodCallResult({
      ref,
      state,
      timeInfo: { elapsedTime, duration, remainingTime },
    });
  });
}
