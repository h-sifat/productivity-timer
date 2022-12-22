import type { Server } from "express-ipc";
import type { Speaker } from "src/speaker";
import type { Notify } from "common/interfaces/other";
import type { ConfigInterface } from "src/config/interface";
import type { TimerRef } from "entities/work-session/work-session";
import type { TimerInfo, TimerInstance } from "src/countdown-timer/type";
import type { WorkSessionServiceInterface } from "use-cases/interfaces/work-session-service";

import { convertTimerInfoToMakeWorkSessionArgument } from "entities/work-session/util";

export interface setUpTimerEventListeners_Argument {
  notify: Notify;
  server: Server;
  speaker: Speaker;
  FileConsole: Console;
  config: ConfigInterface;
  timer: TimerInstance<TimerRef>;
  WorkSessionService: WorkSessionServiceInterface;
}

const timerEventNames = Object.freeze([
  "pause",
  "tick",
  "reset",
  "start",
  "time_up",
  "end_manually",
  "duration_change",
]);

export function setUpTimerEventListeners(
  arg: setUpTimerEventListeners_Argument
) {
  const {
    timer,
    config,
    notify,
    server,
    speaker,
    FileConsole,
    WorkSessionService,
  } = arg;

  timer.on("err:time_decrement", () => {
    notify({
      title: config.NOTIFICATION_TITLE,
      message: `Paused timer because date/time has decremented.`,
    });
  });

  timer.on("err:wake_up_or_time_increment", () => {
    notify({
      title: config.NOTIFICATION_TITLE,
      message: `Paused timer because computer went to sleep or date/time has incremented.`,
    });
  });

  server.createChannels(config.TIMER_BROADCAST_CHANNEL);
  for (const eventName of timerEventNames)
    timer.on(eventName, (data) => {
      server.broadcast({
        data: { event: eventName, data },
        channel: config.TIMER_BROADCAST_CHANNEL,
      });
    });

  timer.on("time_up", async (timerInfo) => {
    speaker.play({ timeout: config.BEEP_DURATION_MS });

    await saveWorkSession(timerInfo);

    // @TODO add a name to timerRef
    if (config.SHOW_TIMER_NOTIFICATIONS)
      notify({ title: config.NOTIFICATION_TITLE, message: `Timer ended.` });
  });

  timer.on("end_manually", async (timerInfo) => {
    await saveWorkSession(timerInfo);
  });

  async function saveWorkSession(timerInfo: TimerInfo<TimerRef>) {
    if (!timerInfo.ref) return;

    try {
      await WorkSessionService.addWorkSession({
        workSessionInfo: convertTimerInfoToMakeWorkSessionArgument(timerInfo),
      });
    } catch (ex) {
      FileConsole.log(Date.now(), ex);
      notify({
        title: config.NOTIFICATION_TITLE,
        message: `Could not save work session to database. Please see logs.`,
      });
    }
  }
}
