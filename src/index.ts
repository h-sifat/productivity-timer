import path from "path";
import * as fs from "fs";
import { getConfig } from "./config";
import { notify } from "common/util/notify";
import { makeServices } from "./make-services";
import { makeAllDatabase } from "./data-access";
import { Server } from "express-ipc/dist/server";
import { configureApplication } from "./configure";
import { makeControllers } from "./make-controllers";
import { makeExpressIPCMiddleware } from "./server/util";

import { AllDatabases } from "./data-access";

interface initApplication_Argument {
  log(...args: any[]): Promise<void>;
}
async function initApplication(arg: initApplication_Argument) {
  const { log } = arg;

  try {
    await configureApplication({ log });
  } catch (ex) {
    await log(ex.message);
    process.exit(1);
  }

  const config = getConfig();
  const server = new Server();
  let databases: AllDatabases;

  const closeApplication = async () => {
    if (databases) await databases.internalDatabase.close();
    if (server.socketPath) server.close();
    process.exit(1);
  };

  const FileLogger = (() => {
    const LOG_PATH = path.join(config.DATA_DIR, config.LOG_FILE_NAME);
    const writeStream = fs.createWriteStream(LOG_PATH, { flags: "a+" });

    return new console.Console(writeStream);
  })();

  async function notifyDatabaseCorruption(error: any) {
    notify({
      title: config.NOTIFICATION_TITLE,
      message: `Database corrupted, Closing server. Please see logs.`,
    });

    FileLogger.log(Date.now(), error);
    await closeApplication();
  }

  try {
    await log("Initializing database.");
    databases = await makeAllDatabase({ notifyDatabaseCorruption });
    await log("\tDatabase initialized");
  } catch (ex) {
    await log(`\tError: ${ex.message}`);
    process.exit(1);
  }

  const services = makeServices({ databases });
  const controllers = makeControllers({ services });

  databases.internalDatabase.on("db_subprocess:crashed", () => {
    notify({
      title: config.NOTIFICATION_TITLE,
      message: `Database sub-process died. Trying to respawn.`,
    });
  });

  databases.internalDatabase.on("db_subprocess:re_spawned", () => {
    notify({
      title: config.NOTIFICATION_TITLE,
      message: `Database sub-process respawned.`,
    });
  });

  databases.internalDatabase.on("db_subprocess:re_spawn_failed", async () => {
    notify({
      title: config.NOTIFICATION_TITLE,
      message: `Database sub-process respawn failed. Closing app.`,
    });

    await closeApplication();
  });

  for (const method of ["get", "post", "patch", "delete"] as const) {
    const controllerAndPathPairs = [
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

  server.listen({
    deleteSocketBeforeListening: true,
    path: { namespace: "pt_by_sifat", id: "v1_0_0" },
    callback: () => log(`server running at socket: "${server.socketPath}"`),
  });
}

initApplication({ log: console.log as any });
