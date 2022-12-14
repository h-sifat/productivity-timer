import path from "path";

export interface ConfigInterface {
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
  DB_BACKUP_PATH: string;
  DB_SUB_PROCESS_MODULE_PATH: string;
  DB_CLOSE_TIMEOUT_WHEN_KILLING: number;
}

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
  DB_BACKUP_PATH: "",
  DB_PATH: ":memory:",
  DB_CLOSE_TIMEOUT_WHEN_KILLING: 30,
  DB_SUB_PROCESS_MODULE_PATH: path.join(
    process.cwd(),
    "src/data-access/db/subprocess-db.js"
  ),
});

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
