import { notify } from "common/util/notify";

import type { ConfigInterface } from "src/config/interface";
import type SqliteDatabase from "data-access/db/mainprocess-db";

export interface addDatabaseEventListeners_Argument {
  config: ConfigInterface;
  database: SqliteDatabase;
  closeApplication(): void | Promise<void>;
}

/**
 * Notifies the user about fatal database errors
 * */
export function addDatabaseEventListeners(
  arg: addDatabaseEventListeners_Argument
) {
  const { database, closeApplication, config } = arg;

  database.on("db_subprocess:crashed", () => {
    notify({
      title: config.NOTIFICATION_TITLE,
      message: `Database sub-process died. Trying to respawn.`,
    });
  });

  database.on("db_subprocess:re_spawned", () => {
    notify({
      title: config.NOTIFICATION_TITLE,
      message: `Database sub-process respawned.`,
    });
  });

  database.on("db_subprocess:re_spawn_failed", async () => {
    notify({
      title: config.NOTIFICATION_TITLE,
      message: `Database sub-process respawn failed. Closing app.`,
    });

    await closeApplication();
  });
}
