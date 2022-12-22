import path from "path";
import { Speaker } from "./speaker";
import { getConfig } from "./config";
import { notify } from "common/util/notify";
import { AllDatabases } from "./data-access";
import { makeServices } from "./make-services";
import WorkSession from "entities/work-session";
import { makeAllDatabase } from "./data-access";
import { Server } from "express-ipc/dist/server";
import { makeFileConsole } from "common/util/fs";
import { configureApplication } from "./configure";
import CountDownTimer from "./countdown-timer/timer";
import { makeControllers } from "./make-controllers";
import { makeExpressIPCMiddleware } from "./server/util";
import { addDatabaseEventListeners } from "./start-up/db";
import { makeTimerController } from "./controllers/timer";
import { setUpTimerEventListeners } from "./start-up/timer";
import { unixMsTimestampToUsLocaleDateString } from "./common/util/date-time";

import type { TimerInstance } from "./countdown-timer/type";
import type { TimerRef } from "entities/work-session/work-session";

interface initApplication_Argument {
  log(...args: any[]): Promise<void>;
}
async function initApplication(arg: initApplication_Argument) {
  const { log } = arg;

  // ------------ Loading Configurations ----------------
  try {
    await configureApplication({ log });
  } catch (ex) {
    await log(ex.message);
    process.exit(1);
  }
  // ------------ End Loading Configurations ----------------

  const config = getConfig();
  const server = new Server();
  let databases: AllDatabases;

  const closeApplication = async () => {
    if (databases) await databases.internalDatabase.close();
    if (server.socketPath) server.close();
    process.exit(1);
  };

  const FileConsole = makeFileConsole({
    filepath: path.join(config.DATA_DIR, config.LOG_FILE_NAME),
  });

  async function notifyDatabaseCorruption(error: any) {
    notify({
      title: config.NOTIFICATION_TITLE,
      message: `Database corrupted, Closing server. Please see logs.`,
    });

    FileConsole.log(Date.now(), error);
    await closeApplication();
  }

  try {
    await log("Initializing database.");
    databases = await makeAllDatabase({ notifyDatabaseCorruption });

    await log("\tDatabase initialized");

    addDatabaseEventListeners({
      config,
      closeApplication,
      database: databases.internalDatabase,
    });
  } catch (ex) {
    await log(`\tError: ${ex.message}`);
    process.exit(1);
  }

  const services = makeServices({ databases });

  // --------- Setting Up Timer ------------------------
  const timer = new CountDownTimer({
    clearInterval,
    TICK_INTERVAL_MS: 1000, // 1s
    currentTimeMs: () => Date.now(),
    setInterval: ({ callback, interval }) =>
      setInterval(<any>callback, interval),
    getDateFromTimeMs: unixMsTimestampToUsLocaleDateString,
    assertValidRef: WorkSession.validator.assertValidReference,
    MIN_ALLOWED_TICK_DIFF_MS: 950, // a little less than TICK_INTERVAL_MS
    MAX_ALLOWED_TICK_DIFF_MS: 5_000, // a little greater that TICK_INTERVAL_MS
  }) as TimerInstance<TimerRef>;

  const speaker = new Speaker({
    mPlayerPath: config.MPLAYER_PATH,
    audioPath: config.MPLAYER_AUDIO_PATH,
  });

  const timerController = makeTimerController({
    timer,
    DEFAULT_TIMER_DURATION: config.DEFAULT_TIMER_DURATION_MS,
  });

  setUpTimerEventListeners({
    timer,
    config,
    notify,
    server,
    speaker,
    FileConsole,
    WorkSessionService: services.workSession,
  });

  // --------- End Setting Up Timer --------------------

  // --------- Registering API Routes -------------------
  const controllers = makeControllers({ services });

  for (const method of ["get", "post", "patch", "delete"] as const) {
    const controllerAndPathPairs = [
      [timerController, config.API_TIMER_PATH],
      [controllers.project, config.API_PROJECT_PATH],
      [controllers.category, config.API_CATEGORY_PATH],
      [controllers.workSession, config.API_WORK_SESSION_PATH],
    ] as const;

    for (const [controllerGroup, path] of controllerAndPathPairs)
      if (method in controllerGroup)
        server[method](
          path,
          makeExpressIPCMiddleware({
            controller: (controllerGroup as any)[method],
          })
        );
  }
  // --------- End Registering API Routes -------------------

  // --------- Starting Server -------------------------------
  server.listen({
    deleteSocketBeforeListening: true,
    path: { namespace: "pt_by_sifat", id: "v1_0_0" },
    callback: () => log(`server running at socket: "${server.socketPath}"`),
  });
}

initApplication({ log: console.log as any });
