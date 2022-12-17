import path from "path";
import { homedir } from "os";

export interface ConfigInterface {
  [key: string]: any;
  // category
  CATEGORY_MAX_NAME_LENGTH: number;
  CATEGORY_VALID_NAME_PATTERN: RegExp;
  CATEGORY_MAX_DESCRIPTION_LENGTH: number;
  CATEGORY_MSG_NAME_DOES_NOT_MATCH_PATTERN: string;

  // project
  PROJECT_MAX_NAME_LENGTH: number;
  PROJECT_VALID_NAME_PATTERN: RegExp;
  PROJECT_MAX_DESCRIPTION_LENGTH: number;
  PROJECT_MIN_HOUR_BEFORE_DEADLINE: number;
  PROJECT_MSG_NAME_DOES_NOT_MATCH_PATTERN: string;

  // work session
  WORK_SESSION_MAX_ALLOWED_ELAPSED_TIME_DIFF: number;

  // db
  DB_PATH: string;
  DATA_DIR: string;
  DB_FILE_NAME: string;
  LOG_FILE_NAME: string;
  DB_BACKUP_DIR: string;
  DB_BACKUP_FILE_NAME: string;
  DB_BACKUP_TEMP_FILE_NAME: string;
  DB_SUB_PROCESS_MODULE_PATH: string;
  DB_CLOSE_TIMEOUT_WHEN_KILLING: number;

  // other
  MPLAYER_PATH: string;
  CONFIG_FILE_PATH: string;
  SOCKET_PIPE_NAME: string;
  BEEP_DURATION_MS: number;
  NOTIFICATION_TITLE: string;

  // api
  API_PROJECT_PATH: string;
  API_CATEGORY_PATH: string;
  API_WORK_SESSION_PATH: string;
}

export const DEFAULT_MPLAYER_PATH = "mplayer";
export const DEFAULT_DATA_DIR = path.join(homedir(), ".p-timer");
export const DEFAULT_BACKUP_DIR = path.join(homedir(), ".p-timer-bak");

const DB_FILE_NAME = "p-timer.db";
const LOG_FILE_NAME = "logs.txt";
const DB_BACKUP_FILE_NAME = "p-timer.bak.db";
const DB_BACKUP_TEMP_FILE_NAME = "p-timer.bak-temp.db";
const CONFIG_FILE_PATH = path.join(homedir(), ".ptrc.json");
export const DEFAULT_BEEP_DURATION_MS = 60_0000;

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
  DB_BACKUP_FILE_NAME,
  DB_PATH: ":memory:",
  DB_BACKUP_TEMP_FILE_NAME,
  DATA_DIR: DEFAULT_DATA_DIR,
  DB_BACKUP_DIR: DEFAULT_BACKUP_DIR,
  DB_CLOSE_TIMEOUT_WHEN_KILLING: 30,
  DB_SUB_PROCESS_MODULE_PATH: path.join(
    process.cwd(),
    "src/data-access/db/subprocess-db.js"
  ),

  // other
  CONFIG_FILE_PATH,
  MPLAYER_PATH: "mplayer",
  BEEP_DURATION_MS: DEFAULT_BEEP_DURATION_MS,
  NOTIFICATION_TITLE: "Productivity Timer",

  // api
  API_PROJECT_PATH: "/project",
  API_CATEGORY_PATH: "/category",
  API_WORK_SESSION_PATH: "/work-session",
  SOCKET_PIPE_NAME: "pt_by_sifat_api_v1_0_0",
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
  cache_size: 10_000,
  foreign_keys: "ON",
  synchronous: "EXTRA",
  default_cache_size: 10_000,
});
