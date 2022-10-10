import type SqliteDatabase from "./db/mainprocess-db";
import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";
import type { ProjectFields, ProjectValidator } from "entities/project/project";
import type { QueryMethodArguments as QM_Arguments } from "use-cases/interfaces/project-db";

import EPP from "common/util/epp";
import Project from "entities/project";

const assertValidProject: ProjectValidator["validate"] =
  Project.validator.validate;

const TABLE_NAME = "projects";

const PREPARED_QUERY_NAMES = Object.freeze({
  insert: "project/insert",
  findAll: "project/findAll",
  findById: "project/findById",
  findByName: "project/findByName",
  deleteById: "project/deleteById",
  updateById: "project/updateById",
});

const PREPARED_QUERY_STATEMENTS: {
  [k in keyof typeof PREPARED_QUERY_NAMES]: string;
} = Object.freeze({
  findAll: `select * from ${TABLE_NAME};`,
  findById: `select * from ${TABLE_NAME} where id = $id;`,
  findByName: `select * from ${TABLE_NAME} where name = $name;`,
  deleteById: `delete from ${TABLE_NAME} where id = $id;`,

  insert: `insert into projects
  (id, name, status, deadline, createdAt, categoryId, description)
  values ( $id, $name, $status, $deadline, $createdAt, $categoryId, $description);`,

  updateById: `update ${TABLE_NAME} set
    name = $name,
    status = $status,
    deadline = $deadline,
    createdAt = $createdAt,
    categoryId = $categoryId,
    description = $description
  where id = $id;`,
});

export default function buildProjectDatabase(builderArg: {
  db: SqliteDatabase;
  // @ts-ignore
}): ProjectDatabaseInterface {
  const { db } = builderArg;

  const projectDatabase: ProjectDatabaseInterface = Object.freeze({
    insert,
    findAll,
    findById,
    findByName,
    deleteById,
    updateById,
  });
  return projectDatabase;

  // ---------------- Query Functions ----------------
  async function findAll() {
    await prepareQueryIfNotPrepared({ queryMethod: "findAll", db });

    const allCategories = await db.executePrepared({
      name: PREPARED_QUERY_NAMES.findAll,
    });

    for (const category of allCategories)
      validateAndNormalizeProjectRecord(category);

    return allCategories as ProjectFields[];
  }

  async function deleteById(arg: QM_Arguments["deleteById"]) {
    await prepareQueryIfNotPrepared({ queryMethod: "deleteById", db });

    await db.runPrepared({
      name: PREPARED_QUERY_NAMES.deleteById,
      statementArgs: { id: Number(arg.id) },
    });
  }

  async function updateById(arg: QM_Arguments["updateById"]) {
    await prepareQueryIfNotPrepared({ queryMethod: "updateById", db });

    await db.runPrepared({
      name: PREPARED_QUERY_NAMES.updateById,
      statementArgs: { ...arg.edited, id: arg.id },
    });
  }

  async function findById(arg: QM_Arguments["findById"]) {
    await prepareQueryIfNotPrepared({ queryMethod: "findById", db });

    const results = await db.executePrepared({
      name: PREPARED_QUERY_NAMES.findById,
      statementArgs: { id: Number(arg.id) },
    });

    switch (results.length) {
      case 0:
        return null;
      case 1: {
        const project = results[0];
        validateAndNormalizeProjectRecord(project);
        return project;
      }

      default:
        throw new EPP({
          code: "DB_CORRUPTED",
          message: `The database is corrupted. Foreign key constraint violation in table: "${TABLE_NAME}"`,
        });
    }
  }

  async function findByName(arg: QM_Arguments["findByName"]) {
    await prepareQueryIfNotPrepared({ queryMethod: "findByName", db });

    const results = await db.executePrepared({
      name: PREPARED_QUERY_NAMES.findByName,
      statementArgs: { name: arg.name },
    });

    switch (results.length) {
      case 0:
        return null;
      case 1: {
        const project = results[0];
        validateAndNormalizeProjectRecord(project);
        return project;
      }

      default:
        throw new EPP({
          code: "DB_CORRUPTED",
          message: `The database is corrupted. Multiple projects with the same name.`,
        });
    }
  }

  async function insert(project: QM_Arguments["insert"]) {
    await prepareQueryIfNotPrepared({ queryMethod: "insert", db });

    await db.runPrepared({
      name: PREPARED_QUERY_NAMES.insert,
      statementArgs: {
        ...project,
        id: Number(project.id),
        parentId: Number(project.categoryId) || null,
      },
    });
  }
}

function validateAndNormalizeProjectRecord(
  record: any
): asserts record is ProjectFields {
  if (Number.isInteger(record.id)) record.id = record.id.toString();
  if (Number.isInteger(record.categoryId))
    record.categoryId = record.categoryId.toString();

  try {
    assertValidProject(record);
  } catch (ex) {
    throw new EPP({
      code: "DB_CORRUPTED",
      otherInfo: { record },
      message: `The ${TABLE_NAME} table contains invalid projects record(s).`,
    });
  }

  Object.freeze(record);
}

async function prepareQueryIfNotPrepared(arg: {
  db: SqliteDatabase;
  queryMethod: keyof typeof PREPARED_QUERY_STATEMENTS;
}) {
  const { queryMethod, db } = arg;

  const isPrepared = await db.isPrepared({
    name: PREPARED_QUERY_NAMES[queryMethod],
  });

  if (!isPrepared)
    await db.prepare({
      name: PREPARED_QUERY_NAMES[queryMethod],
      statement: PREPARED_QUERY_STATEMENTS[queryMethod],
    });
}
