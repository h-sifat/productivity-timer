import path from "path";
import JSON5 from "json5";
import EPP from "common/util/epp";
import { promises as fsp } from "fs";
import { accessPath } from "common/util/fs";
import type { Log } from "./start-up/interface";
import { getConfig, modifyConfig } from "./config";
import { FileConfigInterface, validateFileConfig } from "./config/util";

export interface configureApplication_Argument {
  log: Log;
  TAB_CHAR: string;
}

export async function configureApplication(arg: configureApplication_Argument) {
  const { log } = arg;

  {
    const initialConfig = getConfig();

    let fileConfig: FileConfigInterface;

    {
      log("Looking for configuration file...");
      const { exists, hasPermissions } = await accessPath({
        path: initialConfig.CONFIG_FILE_PATH,
        permissions: { read: true, write: true },
      });

      if (exists && !hasPermissions)
        throwNotAccessibleError(initialConfig.CONFIG_FILE_PATH);

      if (exists) {
        log.success("Found config file.", 1);

        let unValidatedConfig: any;
        try {
          const configJSON = await fsp.readFile(
            initialConfig.CONFIG_FILE_PATH,
            "utf8"
          );

          unValidatedConfig = JSON5.parse(configJSON);
        } catch (ex) {
          throw new Error(`Could not read/parse config file.`);
        }

        fileConfig = validateFileConfig(unValidatedConfig);
      } else {
        log.error("Config file not found.", 1);
        log.info("Using default configurations.", 1);

        fileConfig = validateFileConfig({}); // will return default values

        await fsp.writeFile(
          initialConfig.CONFIG_FILE_PATH,
          JSON.stringify(fileConfig, null, 4),
          "utf8"
        );
      }
    }

    const DB_PATH = path.join(fileConfig.DATA_DIR, initialConfig.DB_FILE_NAME);

    const assets_dir = path.join(__dirname, "../assets");

    const MPLAYER_AUDIO_PATH =
      fileConfig.MPLAYER_AUDIO_PATH ||
      path.join(assets_dir, __M_PLAYER_AUDIO_FILE_NAME__);

    const NOTIFICATION_ICON_PATH = path.join(
      assets_dir,
      __NOTIFICATION_ICON_FILE_NAME__
    );
    modifyConfig({
      changes: {
        ...fileConfig,
        DB_PATH,
        MPLAYER_AUDIO_PATH,
        NOTIFICATION_ICON_PATH,
      },
    });
  }

  const updatedConfig = getConfig();

  log("Making sure that all data directory exists...");
  for (const dir of [updatedConfig.DATA_DIR, updatedConfig.DB_BACKUP_DIR]) {
    const { exists, hasPermissions } = await accessPath({
      path: dir,
      permissions: { read: true, write: true },
    });

    if (exists && !hasPermissions) throwNotAccessibleError(dir);
    if (exists && (await fsp.stat(dir)).isDirectory()) {
      log.success(`Exists: ${dir}`, 1);
      continue;
    }

    log.error(`Not found: ${dir}.`, 1);
    log.info(`Creating directory: "${dir}"`, 1);
    await fsp.mkdir(dir, { recursive: true });
  }

  const DB_PATH = path.join(updatedConfig.DATA_DIR, updatedConfig.DB_FILE_NAME);
  const DB_BACKUP_PATH = path.join(
    updatedConfig.DB_BACKUP_DIR,
    updatedConfig.DB_BACKUP_FILE_NAME
  );

  log("Checking database file...");

  {
    const { exists, hasPermissions } = await accessPath({
      path: DB_PATH,
      permissions: { read: true, write: true },
    });

    if (exists) {
      if (!hasPermissions) throwNotAccessibleError(DB_PATH);
      else log.success("Database file found.", 1);
    } else {
      log.error("The database file does not exist.", 1);
      log.info("Looking for backup...", 1);

      const { exists, hasPermissions } = await accessPath({
        path: DB_BACKUP_PATH,
        permissions: { read: true, write: true },
      });

      if (exists && !hasPermissions) throwNotAccessibleError(DB_BACKUP_PATH);
      if (exists) {
        log.success("Backup found", 1);
        log.info("Trying to restore backup.", 1);

        await fsp.copyFile(DB_BACKUP_PATH, DB_PATH);

        log.success("Restored backup successfully.", 1);
      } else {
        log.error("No backup found.", 1);
        log.info("Creating new database file.", 1);

        await fsp.writeFile(DB_PATH, "");
      }
    }
  }
}

function throwNotAccessibleError(path: string) {
  throw new EPP({
    code: "PATH_NOT_ACCESSIBLE",
    message: `The path: "${path}" is not accessible.`,
  });
}
