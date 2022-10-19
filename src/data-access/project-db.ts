import type SqliteDatabase from "./db/mainprocess-db";
import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";
import type { ProjectFields, ProjectValidator } from "entities/project/project";
import type { QueryMethodArguments as QM_Arguments } from "use-cases/interfaces/project-db";

import EPP from "common/util/epp";
import Project from "entities/project";
import { makeProcessSingleValueReturningQueryResult } from "./util";

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
  notifyDatabaseCorruption: (arg: any) => void;
}): ProjectDatabaseInterface {
  const { db, notifyDatabaseCorruption } = builderArg;
  const processSingleValueReturningQueryResult =
    makeProcessSingleValueReturningQueryResult<ProjectFields>({
      normalize,
      validate,
      tableName: TABLE_NAME,
      notifyDatabaseCorruption,
    });

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
    await db.prepare({
      overrideIfExists: false,
      name: PREPARED_QUERY_NAMES.findAll,
      statement: PREPARED_QUERY_STATEMENTS.findAll,
    });

    const allCategories = await db.executePrepared({
      name: PREPARED_QUERY_NAMES.findAll,
    });

    for (const category of allCategories) {
      normalize(category);
      validate(category);
    }

    return allCategories as ProjectFields[];
  }

  async function deleteById(arg: QM_Arguments["deleteById"]) {
    await db.prepare({
      overrideIfExists: false,
      name: PREPARED_QUERY_NAMES.deleteById,
      statement: PREPARED_QUERY_STATEMENTS.deleteById,
    });

    await db.runPrepared({
      name: PREPARED_QUERY_NAMES.deleteById,
      statementArgs: { id: Number(arg.id) },
    });
  }

  async function updateById(arg: QM_Arguments["updateById"]) {
    await db.prepare({
      overrideIfExists: false,
      name: PREPARED_QUERY_NAMES.updateById,
      statement: PREPARED_QUERY_STATEMENTS.updateById,
    });

    await db.runPrepared({
      name: PREPARED_QUERY_NAMES.updateById,
      statementArgs: { ...arg.edited, id: arg.id },
    });
  }

  async function findById(arg: QM_Arguments["findById"]) {
    await db.prepare({
      overrideIfExists: false,
      name: PREPARED_QUERY_NAMES.findById,
      statement: PREPARED_QUERY_STATEMENTS.findById,
    });

    const result = await db.executePrepared({
      name: PREPARED_QUERY_NAMES.findById,
      statementArgs: { id: Number(arg.id) },
    });

    return processSingleValueReturningQueryResult({
      result,
      multipleRecordsErrorMessage: `The database is corrupted. Foreign key constraint violation in table: "${TABLE_NAME}".`,
    });
  }

  async function findByName(arg: QM_Arguments["findByName"]) {
    await db.prepare({
      overrideIfExists: false,
      name: PREPARED_QUERY_NAMES.findByName,
      statement: PREPARED_QUERY_STATEMENTS.findByName,
    });

    const result = await db.executePrepared({
      name: PREPARED_QUERY_NAMES.findByName,
      statementArgs: { name: arg.name },
    });

    return processSingleValueReturningQueryResult({
      result,
      multipleRecordsErrorMessage: `The database is corrupted (unique constraint violation). Multiple projects with the same name.`,
    });
  }

  async function insert(project: QM_Arguments["insert"]) {
    await db.prepare({
      overrideIfExists: false,
      name: PREPARED_QUERY_NAMES.insert,
      statement: PREPARED_QUERY_STATEMENTS.insert,
    });

    await db.runPrepared({
      name: PREPARED_QUERY_NAMES.insert,
      statementArgs: {
        ...project,
        id: Number(project.id),
        parentId: Number(project.categoryId) || null,
      },
    });
  }

  function normalize(record: any) {
    if (Number.isInteger(record.id)) record.id = record.id.toString();
    if (Number.isInteger(record.categoryId))
      record.categoryId = record.categoryId.toString();

    Object.freeze(record);
  }

  function validate(record: any): asserts record is ProjectFields {
    try {
      assertValidProject(record);
    } catch (ex) {
      const errorMessage = `The ${TABLE_NAME} table contains invalid category record(s).`;

      notifyDatabaseCorruption({
        table: TABLE_NAME,
        message: errorMessage,
        otherInfo: { record, originalError: ex },
      });

      throw new EPP({
        code: "DB_CORRUPTED",
        otherInfo: { record, originalError: ex },
        message: errorMessage,
      });
    }
  }
}
