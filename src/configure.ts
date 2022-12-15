import path from "path";
import EPP from "common/util/epp";
import { promises as fsp } from "fs";
import { accessPath } from "common/util/fs";
import { getConfig, modifyConfig } from "./config";

export interface configureApplication_Argument {
  log(message: string): Promise<void>;
}

export async function configureApplication(arg: configureApplication_Argument) {
  const { log } = arg;
  const config = getConfig();

  await log("Making sure that all data directory exists.");
  for (const dir of [config.DATA_DIR, config.DB_BACKUP_DIR]) {
    const { exists, hasPermissions } = await accessPath({
      path: dir,
      permissions: { read: true, write: true },
    });

    if (exists && !hasPermissions) throwNotAccessibleError(dir);
    if (exists && (await fsp.stat(dir)).isDirectory()) continue;

    await log(`Creating directory: "${dir}"`);
    await fsp.mkdir(dir, { recursive: true });
  }

  const DB_PATH = path.join(config.DATA_DIR, config.DB_FILE_NAME);
  const DB_BACKUP_PATH = path.join(
    config.DB_BACKUP_DIR,
    config.DB_BACKUP_FILE_NAME
  );

  await log("Checking database file.");

  (async () => {
    {
      const { exists, hasPermissions } = await accessPath({
        path: DB_PATH,
        permissions: { read: true, write: true },
      });

      if (exists && !hasPermissions) throwNotAccessibleError(DB_PATH);
      if (exists) return;
    }

    await log("The database file does not exist. Looking for backup.");

    {
      const { exists, hasPermissions } = await accessPath({
        path: DB_BACKUP_PATH,
        permissions: { read: true, write: true },
      });

      if (exists && !hasPermissions) throwNotAccessibleError(DB_BACKUP_PATH);
      if (exists) {
        await log("Backup found. Trying to restore backup.");
        await fsp.copyFile(DB_BACKUP_PATH, DB_PATH);
        return;
      }

      await log("No backup found. Creating new database file.");
      await fsp.writeFile(DB_PATH, "");
    }
  })();

  modifyConfig({ changes: { DB_PATH, DB_CLOSE_TIMEOUT_WHEN_KILLING: 1000 } });
  // @TODO load config
}

function throwNotAccessibleError(path: string) {
  throw new EPP({
    code: "PATH_NOT_ACCESSIBLE",
    message: `The path: "${path}" is not accessible.`,
  });
}
