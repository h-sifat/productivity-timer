import type { Command } from "commander";
import { withClient } from "cli/util/client";
import { TimerService } from "client/services/timer";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";

export function addMuteTimerCommand(program: Command) {
  program
    .command("mute")
    .description("Mutes the alarm.")
    .alias("m")
    .action(muteTimer);
}

async function muteTimer() {
  await withClient(async (client) => {
    const timerService = new TimerService({
      client,
      url: config.API_TIMER_PATH,
    });

    await timerService.mute();
  });
}
