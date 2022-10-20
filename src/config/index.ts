import path from "path";
import { makeReadonlyProxy } from "common/util/other";

type DEFAULT_CONFIG = Readonly<{
  category: Readonly<{
    MAX_NAME_LENGTH: number;
    VALID_NAME_PATTERN: RegExp;
    MAX_DESCRIPTION_LENGTH: number;
    MSG_NAME_DOES_NOT_MATCH_PATTERN: string;
  }>;
  project: Readonly<{
    MAX_NAME_LENGTH: number;
    VALID_NAME_PATTERN: RegExp;
    MAX_DESCRIPTION_LENGTH: number;
    MIN_HOUR_BEFORE_DEADLINE: number;
    MSG_NAME_DOES_NOT_MATCH_PATTERN: string;
  }>;

  work_session: Readonly<{
    MAX_ALLOWED_ELAPSED_TIME_DIFF: number;
  }>;
}>;

const defaults: DEFAULT_CONFIG = Object.freeze({
  category: Object.freeze({
    MAX_NAME_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 120,
    VALID_NAME_PATTERN: /^[\w_ .-]+$/,
    MSG_NAME_DOES_NOT_MATCH_PATTERN:
      "Category.name must only contain alphanumeric, '_', ' ', '.', and '-' characters.",
  }),
  project: Object.freeze({
    MAX_NAME_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 120,
    MIN_HOUR_BEFORE_DEADLINE: 1,
    VALID_NAME_PATTERN: /^[\w_ .-]+$/,
    MSG_NAME_DOES_NOT_MATCH_PATTERN:
      "Project.name must only contain alphanumeric, '_', ' ', '.', and '-' characters.",
  }),
  work_session: Object.freeze({
    MAX_ALLOWED_ELAPSED_TIME_DIFF: 10_000, // 10 seconds
  }),
});

export function getDefaultEntityConfig<
  EntityName extends keyof DEFAULT_CONFIG
>(arg: { entity: EntityName }) {
  const { entity } = arg;

  return defaults[entity] as DEFAULT_CONFIG[EntityName];
}

const dbConfig = {
  pragmas: Object.freeze({
    encoding: "'UTF-8'",
    cache_size: 10_000,
    foreign_keys: "ON",
    synchronous: "EXTRA",
    default_cache_size: 10_000,
  }),
  // @TODO on production these variables must be changed to appropriate values
  SQLITE_DB_PATH: ":memory:",
  DB_CLOSE_TIMEOUT_WHEN_KILLING: 30,
  SQLITE_SUB_PROCESS_MODULE_PATH: path.join(
    process.cwd(),
    "src/data-access/db/subprocess-db.js"
  ),
};

const readonlyDbConfigProxy = makeReadonlyProxy(dbConfig);

export function getDbConfig(): typeof dbConfig {
  return readonlyDbConfigProxy;
}
