import path from "path";
import { Speaker } from "./speaker";
import { getConfig } from "./config";
import { Log } from "./start-up/interface";
import { notify } from "common/util/notify";
import { AllDatabases } from "./data-access";
import { makeServices } from "./make-services";
import WorkSession from "entities/work-session";
import { log, TAB_CHAR } from "./start-up/util";
import { makeAllDatabase } from "./data-access";
import { Server } from "express-ipc/dist/server";
import { makeFileConsole } from "common/util/fs";
import { configureApplication } from "./configure";
import CountDownTimer from "./countdown-timer/timer";
import { makeControllers } from "./make-controllers";
import { makeAppControllers } from "./controllers/app";
import { makeExpressIPCMiddleware } from "./server/util";
import { addDatabaseEventListeners } from "./start-up/db";
import { makeTimerController } from "./controllers/timer";
import type { TimerInstance } from "./countdown-timer/type";
import { setUpTimerEventListeners } from "./start-up/timer";
import type { TimerRef } from "entities/work-session/work-session";
import { unixMsTimestampToUsLocaleDateString } from "./common/util/date-time";
import { makeDocumentDeleteSideEffect } from "./start-up/document-delete-side-effect";

interface initApplication_Argument {
  log: Log;
}
async function initApplication(arg: initApplication_Argument) {
  const { log } = arg;

  // ------------ Loading Configurations ----------------
  try {
    await configureApplication({ log, TAB_CHAR });
  } catch (ex) {
    log({ message: ex.message, type: "fatal_error" });
    notifyApplicationStartupStatus({ success: false });
    process.exit(1);
  }
  // ------------ End Loading Configurations ----------------

  const config = getConfig();
  const server = new Server();
  let databases: AllDatabases;
  const speaker = new Speaker({
    mPlayerPath: config.MPLAYER_PATH,
    audioPath: config.MPLAYER_AUDIO_PATH,
  });

  const closeApplication = async (exitCode = 1) => {
    if (databases) await databases.internalDatabase.close();
    if (server.socketPath) server.close();
    speaker.close();
    process.exit(exitCode);
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
    log("Initializing database...");
    databases = await makeAllDatabase({ notifyDatabaseCorruption });

    log.success("Database initialized.", 1);

    addDatabaseEventListeners({
      config,
      closeApplication,
      database: databases.internalDatabase,
    });
  } catch (ex) {
    log({
      indentLevel: 1,
      type: "fatal_error",
      message: "Could not initialize database.",
    });
    log.info(`Error: ${ex.message}`);

    notifyApplicationStartupStatus({ success: false });
    await closeApplication();
    process.exit(1);
  }

  // --------- Setting Up Timer ------------------------
  const timer = new CountDownTimer({
    clearInterval,
    TICK_INTERVAL_MS: 1000, // 1s
    currentTimeMs: () => Date.now(),
    setInterval: ({ callback, interval }) =>
      setInterval(<any>callback, interval),
    getDateFromTimeMs: unixMsTimestampToUsLocaleDateString,
    assertValidRef: (ref) => {
      // @ts-ignore shut up!
      if (ref !== null) WorkSession.validator.assertValidReference(ref);
    },
    MIN_ALLOWED_TICK_DIFF_MS: 980, // a little less than TICK_INTERVAL_MS
    MAX_ALLOWED_TICK_DIFF_MS: 5_000, // a little greater that TICK_INTERVAL_MS
  }) as TimerInstance<TimerRef>;

  const services = makeServices({
    databases,
    sideEffects: {
      category: {
        delete: makeDocumentDeleteSideEffect({
          timer,
          documentType: "category",
        }),
      },
      project: {
        delete: makeDocumentDeleteSideEffect({
          timer,
          documentType: "project",
        }),
      },
    },
  });

  const timerController = makeTimerController({
    timer,
    speaker,
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
      [makeAppControllers({ closeApplication }), config.API_APP_PATH],
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
    path: { namespace: config.SERVER_NAMESPACE, id: config.SERVER_ID },
    callback() {
      log(`Server running at socket: "${server.socketPath}"`);
      notifyApplicationStartupStatus({ success: true });
    },
  });
}

function notifyApplicationStartupStatus(arg: { success: boolean }) {
  if (process.send) process.send({ type: "start-up", success: arg.success });
}

async function main() {
  try {
    await initApplication({ log });
  } catch (ex) {
    log({ message: ex.message, type: "fatal_error" });
    notifyApplicationStartupStatus({ success: false });
    process.exitCode = 1;
  }
}

main();
