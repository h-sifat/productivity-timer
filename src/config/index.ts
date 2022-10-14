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

  tables: Object.freeze({
    categories: `create table if not exists categories (
      id integer primary key check(typeof(id) = 'integer'),
      name text not null check(typeof(name) = 'text'),
      hash text not null unique check(typeof(hash) = 'text'),
      createdAt integer not null check(typeof(createdAt) = 'integer'),

      description text default null
        check(typeof(description) = 'text' OR typeof(description) = 'null'),

      parentId integer default null
        check(typeof(parentId) = 'integer' OR typeof(parentId) = 'null')
        references categories(id)
        on update cascade
        on delete cascade
    );`,

    projects: `create table if not exists projects (
      id integer primary key check(typeof(id) = 'integer'),
      status text not null check(typeof(status) = 'text'),
      name text not null collate nocase unique check(typeof(name) = 'text'),
      createdAt integer not null check(typeof(createdAt) = 'integer'),

      deadline integer default null
        check(typeof(deadline) = 'integer' OR typeof(deadline) = 'null'),

      description text default null
        check(typeof(description) = 'text' OR typeof(description) = 'null'),

      categoryId integer default null
        check(typeof(categoryId) = 'integer' OR typeof(categoryId) = 'null')
        references categories(id)
        on update cascade
        on delete set null
    );`,
  }),
};

const readonlyDbConfigProxy = makeReadonlyProxy(dbConfig);

export function getDbConfig(): typeof dbConfig {
  return readonlyDbConfigProxy;
}
