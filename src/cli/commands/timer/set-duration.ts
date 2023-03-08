import {
  parseCliDurationArg,
  durationOptionDescription,
  printTimerMethodCallResult,
} from "cli/util/timer";

import type { Command } from "commander";

import { Option } from "commander";
import { withClient } from "cli/util/client";
import { TimerService } from "client/services/timer";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";

export function addSetTimerDurationCommand(program: Command) {
  program
    .command("set-duration")
    .description("Changes the timer duration while the timer is not running.")
    .addOption(
      new Option("-i, --increment", "increment duration").conflicts("decrement")
    )
    .addOption(
      new Option("-d, --decrement", "increment duration").conflicts("increment")
    )
    .argument("<duration>", durationOptionDescription, parseCliDurationArg)
    .action(setDuration);
}

type SetDurationOptions = { increment?: true } | { decrement?: true };

async function setDuration(duration: number, options: SetDurationOptions) {
  await withClient(async (client) => {
    const timerService = new TimerService({
      client,
      url: config.API_TIMER_PATH,
    });

    let changeType = "absolute";
    if ("increment" in options) changeType = "increment";
    else if ("decrement" in options) changeType = "decrement";

    const data = await timerService.setDuration({
      duration,
      changeType: <any>changeType,
    });
    printTimerMethodCallResult(data);
  });
}
