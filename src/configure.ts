import path from "path";
import EPP from "common/util/epp";
import { promises as fsp } from "fs";
import { accessPath } from "common/util/fs";
import { getConfig, modifyConfig } from "./config";
import { FileConfigInterface, validateFileConfig } from "./config/util";

export interface configureApplication_Argument {
  log(message: string): Promise<void>;
}

export async function configureApplication(arg: configureApplication_Argument) {
  const { log } = arg;

  {
    const initialConfig = getConfig();

    let fileConfig: FileConfigInterface;

    {
      await log("Looking for configuration file...");
      const { exists, hasPermissions } = await accessPath({
        path: initialConfig.CONFIG_FILE_PATH,
        permissions: { read: true, write: true },
      });

      if (exists && !hasPermissions)
        throwNotAccessibleError(initialConfig.CONFIG_FILE_PATH);

      if (exists) {
        await log("\tFound config file.");
        let unValidatedConfig: any;
        try {
          const configJSON = await fsp.readFile(
            initialConfig.CONFIG_FILE_PATH,
            "utf8"
          );

          unValidatedConfig = JSON.parse(configJSON);
        } catch (ex) {
          throw new Error(`\tCould not read/parse config file.`);
        }

        fileConfig = validateFileConfig(unValidatedConfig);
      } else {
        await log(`\tConfig file not found. Using default configurations.`);
        fileConfig = validateFileConfig({}); // will return default values

        await fsp.writeFile(
          initialConfig.CONFIG_FILE_PATH,
          JSON.stringify(fileConfig),
          "utf8"
        );
      }
    }

    // the module name is coming from the webpack.config.js file
    const DB_SUB_PROCESS_MODULE_PATH = path.join(
      __dirname,
      "./db_subprocess.js"
    );

    const DB_PATH = path.join(fileConfig.DATA_DIR, initialConfig.DB_FILE_NAME);
    modifyConfig({
      changes: { ...fileConfig, DB_PATH, DB_SUB_PROCESS_MODULE_PATH },
    });
  }

  const updatedConfig = getConfig();

  await log("Making sure that all data directory exists.");
  for (const dir of [updatedConfig.DATA_DIR, updatedConfig.DB_BACKUP_DIR]) {
    const { exists, hasPermissions } = await accessPath({
      path: dir,
      permissions: { read: true, write: true },
    });

    if (exists && !hasPermissions) throwNotAccessibleError(dir);
    if (exists && (await fsp.stat(dir)).isDirectory()) {
      await log(`\tExists: ${dir}`);
      continue;
    }

    await log(`\tNot found: ${dir}.\n\tCreating directory: "${dir}"`);
    await fsp.mkdir(dir, { recursive: true });
  }

  const DB_PATH = path.join(updatedConfig.DATA_DIR, updatedConfig.DB_FILE_NAME);
  const DB_BACKUP_PATH = path.join(
    updatedConfig.DB_BACKUP_DIR,
    updatedConfig.DB_BACKUP_FILE_NAME
  );

  await log("Checking database file.");

  {
    const { exists, hasPermissions } = await accessPath({
      path: DB_PATH,
      permissions: { read: true, write: true },
    });
    if (exists && !hasPermissions) throwNotAccessibleError(DB_PATH);

    if (!exists) {
      await log("\tThe database file does not exist. Looking for backup.");
      const { exists, hasPermissions } = await accessPath({
        path: DB_BACKUP_PATH,
        permissions: { read: true, write: true },
      });

      if (exists && !hasPermissions) throwNotAccessibleError(DB_BACKUP_PATH);
      if (exists) {
        await log("\tBackup found. Trying to restore backup.");
        await fsp.copyFile(DB_BACKUP_PATH, DB_PATH);
        await log("\tRestored backup.");
      } else {
        await log("\tNo backup found. Creating new database file.");
        await fsp.writeFile(DB_PATH, "");
      }
    } else {
      await log("\tDatabase file found.");
    }
  }
}

function throwNotAccessibleError(path: string) {
  throw new EPP({
    code: "PATH_NOT_ACCESSIBLE",
    message: `The path: "${path}" is not accessible.`,
  });
}
