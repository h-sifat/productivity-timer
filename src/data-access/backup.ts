import { promises as fsp } from "fs";
import { Notify } from "common/interfaces/other";
import type { Database as SqliteDatabase } from "better-sqlite3";

export interface backupDatabase_Argument {
  notifyError?: boolean;
}

export type BackupDatabase = (
  arg: backupDatabase_Argument
) => Promise<{ success: true; error: null } | { success: false; error: any }>;

export interface makeBackupDatabase_Argument {
  NOTIFICATION_TITLE: string;
  DB_BACKUP_FILE_PATH: string;
  DB_BACKUP_TEMP_FILE_PATH: string;

  notify: Notify;
  log(...arg: any[]): void;
  database: SqliteDatabase;

  sideEffect(): Promise<void>;
}

export function makeBackupDatabase(
  builderArg: makeBackupDatabase_Argument
): BackupDatabase {
  const {
    log,
    notify,
    database,
    sideEffect,
    NOTIFICATION_TITLE,
    DB_BACKUP_FILE_PATH,
    DB_BACKUP_TEMP_FILE_PATH,
  } = builderArg;

  return async function backupDatabase(arg: backupDatabase_Argument) {
    try {
      await database.backup(DB_BACKUP_TEMP_FILE_PATH);
      await fsp.rename(DB_BACKUP_TEMP_FILE_PATH, DB_BACKUP_FILE_PATH);

      await sideEffect();

      return { success: true, error: null };
    } catch (ex) {
      const { notifyError = true } = arg;

      log(`Timestamp: ${Date.now()}`, "Could not backup database.", ex);

      if (notifyError)
        notify({
          title: NOTIFICATION_TITLE,
          message: `Could not backup database. Please see error logs.`,
        });

      return { success: false, error: ex };
    }
  };
}
