import { Command, Option } from "commander";
import { withClient } from "cli/util/client";
import { isEmptyObject } from "common/util/other";
import { TimerService } from "client/services/timer";
import { MS_IN_ONE_MINUTE } from "common/util/date-time";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";
import { durationParser, printTimerMethodCallResult } from "cli/util/timer";

const SHORT_BREAK_DURATION = MS_IN_ONE_MINUTE * 5;
const LONG_BREAK_DURATION = MS_IN_ONE_MINUTE * 15;

export function addStartBreakTimerCommand(program: Command) {
  program
    .command("break")
    .description("Stats a timer with anonymous reference.")
    .addOption(
      new Option(
        "-s, --short",
        `starts a ${SHORT_BREAK_DURATION / MS_IN_ONE_MINUTE} minutes timer`
      ).conflicts("long")
    )
    .addOption(
      new Option(
        "-l, --long",
        `starts a ${LONG_BREAK_DURATION / MS_IN_ONE_MINUTE} minutes timer`
      ).conflicts("short")
    )
    .argument(
      "[duration]",
      "the timer duration of format `<number>{s|m|h}`. e.g., 10m, 1h etc."
    )
    .action(startBreak);
}

export async function startBreak(
  durationArg: string | undefined,
  options: { short: true } | { long: true }
) {
  await withClient(async (client) => {
    {
      const isInvalidOptionsArgCombination =
        (durationArg && !isEmptyObject(options)) ||
        (!durationArg && isEmptyObject(options));

      if (isInvalidOptionsArgCombination)
        throw new Error(
          "Options and duration argument cannot be provided together."
        );
    }

    let breakDurationMs: number;
    if (durationArg) breakDurationMs = durationParser(durationArg);
    else
      breakDurationMs =
        "short" in options ? SHORT_BREAK_DURATION : LONG_BREAK_DURATION;

    const timerService = new TimerService({
      client,
      url: config.API_TIMER_PATH,
    });

    const data = await timerService.startBreak({ duration: breakDurationMs });
    printTimerMethodCallResult(data);
  });
}
