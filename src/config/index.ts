import path from "path";
import { homedir } from "os";
import { API_AND_SERVER_CONFIG } from "./other";
import type { ConfigInterface } from "./interface";
import { MS_IN_ONE_MINUTE, MS_IN_ONE_HOUR } from "common/util/date-time";

export const DEFAULT_MPLAYER_PATH = "mplayer";
export const DEFAULT_BEEP_DURATION_MS = MS_IN_ONE_MINUTE; // 60s
export const DEFAULT_DATA_DIR = path.join(homedir(), ".p-timer");
export const DEFAULT_DB_BACKUP_INTERVAL_MS = MS_IN_ONE_HOUR; // 1 hour
export const DEFAULT_BACKUP_DIR = path.join(homedir(), ".p-timer-bak");
export const DEFAULT_TIMER_DURATION_MS = 20 * MS_IN_ONE_MINUTE; // 20 minutes

const DB_FILE_NAME = "p-timer.db";
const LOG_FILE_NAME = "logs.txt";
const DB_BACKUP_FILE_NAME = "p-timer.bak.db";
const DB_BACKUP_TEMP_FILE_NAME = "p-timer.bak-temp.db";
const CONFIG_FILE_PATH = path.join(homedir(), ".ptrc.json");

const config: ConfigInterface = Object.seal({
  // category
  CATEGORY_MAX_NAME_LENGTH: 50,
  CATEGORY_MAX_DESCRIPTION_LENGTH: 120,
  CATEGORY_VALID_NAME_PATTERN: /^[\w_ .-]+$/,
  CATEGORY_MSG_NAME_DOES_NOT_MATCH_PATTERN:
    "Category.name must only contain alphanumeric, '_', ' ', '.', and '-' characters.",

  // project
  PROJECT_MAX_NAME_LENGTH: 50,
  PROJECT_MAX_DESCRIPTION_LENGTH: 120,
  PROJECT_MIN_HOUR_BEFORE_DEADLINE: 1,
  PROJECT_VALID_NAME_PATTERN: /^[\w_ .-]+$/,
  PROJECT_MSG_NAME_DOES_NOT_MATCH_PATTERN:
    "Project.name must only contain alphanumeric, '_', ' ', '.', and '-' characters.",

  // work session
  WORK_SESSION_MAX_ALLOWED_ELAPSED_TIME_DIFF: 20_000, // 20 seconds

  // db
  DB_FILE_NAME,
  LOG_FILE_NAME,
  CONFIG_FILE_PATH,
  DB_BACKUP_FILE_NAME,
  DB_PATH: ":memory:",
  DB_BACKUP_TEMP_FILE_NAME,
  DATA_DIR: DEFAULT_DATA_DIR,
  DB_BACKUP_DIR: DEFAULT_BACKUP_DIR,
  DB_CLOSE_TIMEOUT_WHEN_KILLING: 30,
  DB_BACKUP_INTERVAL_MS: DEFAULT_DB_BACKUP_INTERVAL_MS,
  DB_SUB_PROCESS_MODULE_PATH: path.join(
    process.cwd(),
    "src/data-access/db/subprocess-db.js"
  ),

  // other
  MPLAYER_PATH: "mplayer",
  MPLAYER_AUDIO_PATH: "",

  NOTIFICATION_TITLE: "Productivity Timer",

  // api
  ...API_AND_SERVER_CONFIG,
  // timer
  DEFAULT_TIMER_DURATION_MS,
  SHOW_TIMER_NOTIFICATIONS: true,
  BEEP_DURATION_MS: DEFAULT_BEEP_DURATION_MS,
});

export interface modifyConfig_Argument {
  changes: Partial<ConfigInterface>;
}
export function modifyConfig(arg: modifyConfig_Argument) {
  const { changes } = arg;

  for (const [key, value] of Object.entries(changes))
    if (key in config && typeof config[key] === typeof value)
      config[key] = value;
}

export function getConfig(): ConfigInterface {
  return Object.freeze({ ...config });
}

export const dbPragmas = Object.freeze({
  encoding: "'UTF-8'",
  journal_mode: "WAL",
  cache_size: 10_000,
  foreign_keys: "ON",
  synchronous: "EXTRA",
  default_cache_size: 10_000,
});
