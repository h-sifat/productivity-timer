export const TABLE_SCHEMAS = Object.freeze({
  categories: `create table if not exists categories (
      id integer primary key check(typeof(id) = 'integer'),
      name text not null collate nocase check(typeof(name) = 'text'),
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

  work_sessions: `create table if not exists work_sessions (
      id integer primary key check(typeof(id) == 'integer'),
      startedAt integer not null check(typeof(startedAt) == 'integer'),
      targetDuration integer not null check(typeof(targetDuration) == 'integer'),
      totalElapsedTime integer not null check(typeof(totalElapsedTime) == 'integer'),

      categoryId integer default null
        check(typeof(categoryId) = 'integer' OR typeof(categoryId) = 'null')
        references categories(id)
        on update cascade
        on delete cascade,

      projectId integer default null
        check(typeof(projectId) = 'integer' OR typeof(projectId) = 'null')
        references projects(id)
        on update cascade
        on delete cascade,

      check(
        (projectId is null and categoryId is not null) or
        (projectId is not null and categoryId is null)
      )
    );`,

  work_session_elapsed_time_by_date: `create table if not exists work_session_elapsed_time_by_date (
      date integer not null check(typeof(date) == 'integer'),
      elapsed_time_ms integer not null check(typeof(elapsed_time_ms) == 'integer'),

      work_session_id integer not null 
        check(typeof(work_session_id) == 'integer')
        references work_sessions(id)
        on update cascade
        on delete cascade
    );`,

  work_session_timer_events: `create table if not exists work_session_timer_events (
      name text not null check(typeof(name) == 'text'),
      timestamp integer not null check(typeof(timestamp) == 'integer'),

      work_session_id integer not null 
        check(typeof(work_session_id) == 'integer')
        references work_sessions(id)
        on update cascade
        on delete cascade
    );`,

  meta_info: `create table if not exists meta_info (
      id integer primary key check(typeof(id) = 'integer'),
      json text not null check(typeof(json) == 'text'),
      hash text not null check(typeof(hash) == 'text')
    )`,
});

/**
 * Defines the table creation order. This order is necessary because some tables
 * references other table(s) in their column definition. If a referencing table
 * doesn't exist then the db will throw an error.
 */
export const TABLE_SCHEMA_ORDER: Readonly<Array<keyof typeof TABLE_SCHEMAS>> =
  Object.freeze([
    "categories",
    "projects",
    "work_sessions",
    "work_session_timer_events",
    "work_session_elapsed_time_by_date",
    "meta_info",
  ]);
