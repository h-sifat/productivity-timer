import path from "path";
import { Speaker } from "./speaker";
import { getConfig, getPublicConfig } from "./config";
import { Log } from "./start-up/interface";
import { notify } from "common/util/notify";
import { AllDatabases } from "./data-access";
import WorkSession from "entities/work-session";
import { log, TAB_CHAR } from "./start-up/util";
import { makeAllDatabase } from "./data-access";
import { Server } from "express-ipc/dist/server";
import { makeFileConsole } from "common/util/fs";
import { configureApplication } from "./configure";
import { BROADCAST_CHANNELS } from "./config/other";
import CountDownTimer from "./countdown-timer/timer";
import { makeControllers } from "./make-controllers";
import { makeAppControllers } from "./controllers/app";
import { makeBackupDatabase } from "data-access/backup";
import { makeExpressIPCMiddleware } from "./server/util";
import { makeTimerController } from "./controllers/timer";
import { BackupManager } from "data-access/backup-manager";
import type { TimerInstance } from "./countdown-timer/type";
import { setUpTimerEventListeners } from "./start-up/timer";
import { TimerRefWithName } from "./controllers/timer/interface";
import { makeServiceSideEffects } from "./start-up/make-side-effects";
import { makeServices, makeServices_Argument } from "./make-services";
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

  server.createChannels(Object.values(BROADCAST_CHANNELS));

  let databases: AllDatabases;
  const speaker = new Speaker({
    volume: config.SPEAKER_VOLUME,
    mPlayerPath: config.MPLAYER_PATH,
    audioPath: config.MPLAYER_AUDIO_PATH,
  });

  const closeApplication = async (exitCode = 1) => {
    if (databases) databases.internalDatabase.close();
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

  const backupDatabase = makeBackupDatabase({
    sideEffect: async () => {
      await services.metaInfo.update({
        audience: "private",
        changes: { lastBackupTime: Date.now() },
      });
    },
    database: databases.internalDatabase,
    log: FileConsole.log.bind(FileConsole),
    notify,
    NOTIFICATION_TITLE: config.NOTIFICATION_TITLE,
    DB_BACKUP_FILE_PATH: path.join(
      config.DB_BACKUP_DIR,
      config.DB_BACKUP_FILE_NAME
    ),
    DB_BACKUP_TEMP_FILE_PATH: path.join(
      config.DB_BACKUP_DIR,
      config.DB_BACKUP_TEMP_FILE_NAME
    ),
  });

  // ---------------- Setting up Backup Manager ------------
  const backupManager = new BackupManager({
    BACKUP_INTERVAL_MS: config.DB_BACKUP_INTERVAL_MS,
    backupDatabase: async () => {
      await backupDatabase({ notifyError: true });
    },
    getLastBackupTime: async () => {
      const metaInfo = await services.metaInfo.get({ audience: "private" });
      return metaInfo.lastBackupTime;
    },
  });

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
    MIN_ALLOWED_TICK_DIFF_MS: 995, // a little less than TICK_INTERVAL_MS
    MAX_ALLOWED_TICK_DIFF_MS: 2000, // a little greater than TICK_INTERVAL_MS
  }) as TimerInstance<TimerRefWithName>;

  const services = makeServices({
    databases,
    sideEffects: {
      category: {
        ...makeServiceSideEffects({
          server,
          methods: ["post", "patch"],
          channel: BROADCAST_CHANNELS.CATEGORY_BROADCAST_CHANNEL,
        }),
        delete: makeDocumentDeleteSideEffect({
          timer,
          server,
          documentType: "category",
          broadcastChannel: BROADCAST_CHANNELS.CATEGORY_BROADCAST_CHANNEL,
        }),
      },
      project: {
        ...makeServiceSideEffects({
          server,
          methods: ["post", "patch"],
          channel: BROADCAST_CHANNELS.PROJECT_BROADCAST_CHANNEL,
        }),
        delete: makeDocumentDeleteSideEffect({
          timer,
          server,
          documentType: "project",
          broadcastChannel: BROADCAST_CHANNELS.PROJECT_BROADCAST_CHANNEL,
        }),
      },
      meta: makeServiceSideEffects<
        makeServices_Argument["sideEffects"]["meta"]
      >({
        server,
        methods: ["patch"],
        channel: BROADCAST_CHANNELS.META_INFO_BROADCAST_CHANNEL,
      }),
    },
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

  {
    const controllers = makeControllers({
      services,
      other: { config: getPublicConfig() },
    });
    const timerControllers = makeTimerController({
      timer,
      speaker,
      DEFAULT_TIMER_DURATION: config.DEFAULT_TIMER_DURATION_MS,
    });

    const appControllers = makeAppControllers({
      backupDatabase,
      closeApplication,
    });
    const controllerAndPathPairs = [
      [appControllers, config.API_APP_PATH],
      [timerControllers, config.API_TIMER_PATH],
      [controllers.config, config.API_CONFIG_PATH],
      [controllers.project, config.API_PROJECT_PATH],
      [controllers.category, config.API_CATEGORY_PATH],
      [controllers.metaInfo, config.API_META_INFO_PATH],
      [controllers.workSession, config.API_WORK_SESSION_PATH],
    ] as const;

    for (const method of ["get", "post", "patch", "delete"] as const) {
      for (const [controllerGroup, path] of controllerAndPathPairs)
        if (method in controllerGroup)
          server[method](
            path,
            makeExpressIPCMiddleware({
              controller: (controllerGroup as any)[method],
            })
          );
    }
  }
  // --------- End Registering API Routes -------------------

  // --------- Starting Server -------------------------------
  log("Starting server...");
  server.listen({
    deleteSocketBeforeListening: true,
    path: { namespace: config.SERVER_NAMESPACE, id: config.SERVER_ID },
    async callback() {
      log.success(`Server running at socket: "${server.socketPath}"`, 1);

      log(`Initializing database backup manager...`);
      await backupManager.init();
      log.success(`Backup manager initialized.`, 1);
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
