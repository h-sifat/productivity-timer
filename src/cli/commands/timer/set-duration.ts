import type { Command } from "commander";
import { withClient } from "cli/util/client";
import {
  DurationOption,
  durationParser,
  printTimerMethodCallResult,
} from "cli/util/timer";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";

export function addSetTimerDurationCommand(program: Command) {
  program
    .command("set-duration")
    .description("Changes the timer duration while the timer is not running.")
    .argument(
      "<duration>",
      "the timer duration of format `<number>{s|m|h}`. e.g., 10m, 1h etc.",
      durationParser
    )
    .action(setDuration);
}

async function setDuration(duration: number) {
  await withClient(async (client) => {
    const { body } = (await client.post(config.API_TIMER_PATH, {
      query: {},
      headers: {},
      body: { name: "setDuration", arg: { duration } },
    })) as any;

    if (!body.success) throw body.error;

    printTimerMethodCallResult(body.data);
  });
}
