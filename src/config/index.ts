import path from "path";
import { homedir } from "os";
import { API_AND_SERVER_CONFIG } from "./other";
import type { ConfigInterface, PublicConfigInterface } from "./interface";
import { MS_IN_ONE_MINUTE, MS_IN_ONE_HOUR } from "common/util/date-time";
import { pick } from "common/util/other";

export const { DEFAULT_DATA_DIR, CONFIG_FILE_PATH, DEFAULT_BACKUP_DIR } =
  (() => {
    const config: { [k: string]: string } =
      __BUILD_MODE__ === "production"
        ? {
            DEFAULT_DATA_DIR: ".p-timer",
            CONFIG_FILE_PATH: ".ptrc.json",
            DEFAULT_BACKUP_DIR: ".p-timer-bak",
          }
        : {
            DEFAULT_DATA_DIR: ".p-timer-dev",
            CONFIG_FILE_PATH: ".ptrc-dev.json",
            DEFAULT_BACKUP_DIR: ".p-timer-bak-dev",
          };

    for (const key in config) config[key] = path.join(homedir(), config[key]);

    return config;
  })();

export const DEFAULT_MPLAYER_PATH = "mplayer";
export const DEFAULT_BEEP_DURATION_MS = 10_000; // 20s
export const DEFAULT_DB_BACKUP_INTERVAL_MS = MS_IN_ONE_HOUR; // 1 hour
export const DEFAULT_TIMER_DURATION_MS = 20 * MS_IN_ONE_MINUTE; // 20 minutes

const DB_FILE_NAME = "p-timer.db";
const LOG_FILE_NAME = "logs.txt";
const DB_BACKUP_FILE_NAME = "p-timer.bak.db";
const DB_BACKUP_TEMP_FILE_NAME = "p-timer.bak-temp.db";

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
  SPEAKER_VOLUME: 80,
  FIRST_DAY_OF_WEEK: "Saturday",
  NOTIFICATION_ICON_PATH: "",

  NOTIFICATION_TITLE:
    __BUILD_MODE__ === "production"
      ? "Productivity Timer"
      : "Productivity Timer Dev",

  // api
  ...API_AND_SERVER_CONFIG,
  // timer
  DEFAULT_TIMER_DURATION_MS,
  SHOW_TIMER_NOTIFICATIONS: true,
  BEEP_DURATION_MS: DEFAULT_BEEP_DURATION_MS,
  AUTO_START_BREAK: false,
  AUTO_START_BREAK_DURATION: 5 * MS_IN_ONE_MINUTE,
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

export const PUBLIC_CONFIG_FIELDS: Readonly<
  Array<keyof PublicConfigInterface>
> = Object.freeze(["FIRST_DAY_OF_WEEK"] as const);

export function getPublicConfig() {
  return pick(config, [...PUBLIC_CONFIG_FIELDS]);
}

export const dbPragmas = Object.freeze({
  encoding: "'UTF-8'",
  journal_mode: "WAL",
  cache_size: 10_000,
  foreign_keys: "ON",
  synchronous: "EXTRA",
  default_cache_size: 10_000,
});
