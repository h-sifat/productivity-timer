import type { Database as SqliteDatabase } from "better-sqlite3";
import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";
import type { ProjectFields, ProjectValidator } from "entities/project/project";
import type { QueryMethodArguments as QM_Arguments } from "use-cases/interfaces/project-db";

import {
  makeGetMaxId,
  prepareQueries,
  asyncifyDatabaseMethods,
  makeProcessSingleValueReturningQueryResult,
} from "./util";
import EPP from "common/util/epp";
import Project from "entities/project";

const assertValidProject: ProjectValidator["validate"] =
  Project.validator.validate;

const TABLE_NAME = "projects";
const MAX_ID_COLUMN_NAME = "max_id";

const queries = Object.freeze({
  findAll: `select * from ${TABLE_NAME};`,
  deleteById: `delete from ${TABLE_NAME} where id = $id;`,
  findById: `select * from ${TABLE_NAME} where id = $id;`,
  findByName: `select * from ${TABLE_NAME} where name = $name;`,
  getMaxId: `select max(id) as ${MAX_ID_COLUMN_NAME} from ${TABLE_NAME};`,

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

  const getMaxId = makeGetMaxId({
    db,
    idFieldName: "id",
    tableName: TABLE_NAME,
  });

  const preparedQueryStatements = prepareQueries({ db, queries });

  // ---------------- Query Functions ----------------
  function findAll() {
    const allCategories = preparedQueryStatements.findAll.all();

    for (const category of allCategories) {
      normalize(category);
      validate(category);
    }

    return allCategories as ProjectFields[];
  }

  function deleteById(arg: QM_Arguments["deleteById"]) {
    preparedQueryStatements.deleteById.run({ id: Number(arg.id) });
  }

  async function updateById(arg: QM_Arguments["updateById"]) {
    preparedQueryStatements.updateById.run({ ...arg.edited, id: arg.id });
  }

  async function findById(arg: QM_Arguments["findById"]) {
    const result = preparedQueryStatements.findById.all({ id: Number(arg.id) });

    return processSingleValueReturningQueryResult({
      result,
      multipleRecordsErrorMessage: `The database is corrupted. Foreign key constraint violation in table: "${TABLE_NAME}".`,
    });
  }

  async function findByName(arg: QM_Arguments["findByName"]) {
    const result = preparedQueryStatements.findByName.all({ name: arg.name });

    return processSingleValueReturningQueryResult({
      result,
      multipleRecordsErrorMessage: `The database is corrupted (unique constraint violation). Multiple projects with the same name.`,
    });
  }

  async function insert(project: QM_Arguments["insert"]) {
    preparedQueryStatements.insert.run({
      ...project,
      id: Number(project.id),
      parentId: Number(project.categoryId) || null,
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

  const projectDatabase: ProjectDatabaseInterface = Object.freeze(
    asyncifyDatabaseMethods({
      insert,
      findAll,
      getMaxId,
      findById,
      findByName,
      deleteById,
      updateById,
    })
  );
  return projectDatabase;
}
