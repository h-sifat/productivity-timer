import {
  parseCliDurationArg,
  durationOptionDescription,
  printTimerMethodCallResult,
} from "cli/util/timer";

import type { Command } from "commander";
import { withClient } from "cli/util/client";
import { TimerService } from "client/services/timer";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";

export function addSetTimerDurationCommand(program: Command) {
  program
    .command("set-duration")
    .description("Changes the timer duration while the timer is not running.")
    .argument("<duration>", durationOptionDescription, parseCliDurationArg)
    .action(setDuration);
}

async function setDuration(duration: number) {
  await withClient(async (client) => {
    const timerService = new TimerService({
      client,
      url: config.API_TIMER_PATH,
    });

    const data = await timerService.setDuration({ duration });
    printTimerMethodCallResult(data);
  });
}
