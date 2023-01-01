import { DurationOption } from "./util";
import type { Command } from "commander";
import { withClient } from "cli/util/client";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";

export function addResetTimerCommand(program: Command) {
  program
    .command("reset")
    .description("Resets the countdown timer.")
    .option("-h, --hard-reset", "resets the category/project reference", false)
    .addOption(DurationOption)
    .action(resetTimer);
}

interface resetTimer_Options {
  hard?: boolean;
  duration?: number;
}

export async function resetTimer(options: resetTimer_Options) {
  await withClient(async (client) => {
    const { body } = (await client.post(config.API_TIMER_PATH, {
      query: {},
      headers: {},
      body: { name: "reset", arg: options },
    })) as any;

    if (!body.success) throw body.error;

    console.dir(body.data, { depth: null });
  });
}
