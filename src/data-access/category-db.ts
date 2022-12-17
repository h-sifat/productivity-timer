import type {
  CategoryFields,
  CategoryValidator,
} from "entities/category/category";
import type { MakeGetMaxId } from "./interface";
import type SqliteDatabase from "./db/mainprocess-db";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import type { QueryMethodArguments as QM_Arguments } from "use-cases/interfaces/category-db";

import EPP from "common/util/epp";
import Category from "entities/category";
import { makeProcessSingleValueReturningQueryResult } from "./util";

const assertValidCategory: CategoryValidator["validate"] =
  Category.validator.validate;

const TABLE_NAME = "categories";
const MAX_ID_COLUMN_NAME = "max_id";

const PREPARED_QUERY_NAMES = Object.freeze({
  insert: "cat/insert",
  findAll: "cat/findAll",
  getMaxId: "cat/getMaxId",
  findById: "cat/findById",
  updateById: "cat/updateById",
  findByHash: "cat/findByHash",
  findByName: "cat/findByName",
  deleteById: "cat/deleteById",
  findSubCategories: "cat/findSubCategories",
  findParentCategories: "cat/findParentCategories",
});

const PREPARED_QUERY_STATEMENTS: {
  [key in keyof typeof PREPARED_QUERY_NAMES]: string;
} = Object.freeze({
  findAll: `select * from ${TABLE_NAME};`,
  findById: `select * from ${TABLE_NAME} where id=$id;`,
  findByHash: `select * from ${TABLE_NAME} where hash=$hash;`,
  findByName: `select * from ${TABLE_NAME} where name=$name;`,
  deleteById: `delete from ${TABLE_NAME} where id = ($id);`,
  getMaxId: `select max(id) as ${MAX_ID_COLUMN_NAME} from ${TABLE_NAME};`,

  insert: `insert into ${TABLE_NAME}
  ( id, name, hash, parentId, createdAt, description)
  values ( $id, $name, $hash, $parentId, $createdAt, $description);`,

  updateById: `update ${TABLE_NAME}
    set
      name = $name,
      hash = $hash,
      parentId = $parentId,
      createdAt = $createdAt,
      description = $description
    where id = $id;`,

  /*
   * @WARNING:
   * do not change the order of column names!
   * */
  findParentCategories: `with recursive
    parent_categories(id, name, parentId, hash, createdAt, description) as (
    select
      id, name, parentId, hash, createdAt, description
    from categories where id = (
      select parentId from ${TABLE_NAME}
      where id = $id
    )

    union 

    select
      c.id as id,
      c.name as name,
      c.parentId as parentId,
      c.hash as hash,
      c.createdAt as createdAt,
      c.description as description
    from ${TABLE_NAME} as c
    inner join parent_categories as pc
      on c.id = pc.parentId
  )
  select * from parent_categories;`,

  findSubCategories: `with recursive
  sub_categories(id, name, parentId, hash, createdAt, description) as (
    select
      id, name, parentId, hash, createdAt, description
    from ${TABLE_NAME}
    where parentId = $parentId

    union 

    select
      c.id as id,
      c.name as name,
      c.parentId as parentId,
      c.hash as hash,
      c.createdAt as createdAt,
      c.description as description
    from ${TABLE_NAME} as c
    inner join sub_categories as sc
      on c.parentId = sc.id
  )
  select * from sub_categories;`,
});

interface BuildCategoryDatabase_Argument {
  db: SqliteDatabase;
  makeGetMaxId: MakeGetMaxId;
  notifyDatabaseCorruption: (arg: any) => void;
}
export default function buildCategoryDatabase(
  builderArg: BuildCategoryDatabase_Argument
): CategoryDatabaseInterface {
  const { db, notifyDatabaseCorruption, makeGetMaxId } = builderArg;
  const processSingleValueReturningQueryResult =
    makeProcessSingleValueReturningQueryResult<CategoryFields>({
      validate,
      normalize,
      tableName: TABLE_NAME,
      notifyDatabaseCorruption,
    });

  const getMaxId = makeGetMaxId({
    db,
    maxIdColumnName: MAX_ID_COLUMN_NAME,
    preparedQueryName: PREPARED_QUERY_NAMES.getMaxId,
    preparedQueryStatement: PREPARED_QUERY_STATEMENTS.getMaxId,
  });

  const categoryDb: CategoryDatabaseInterface = Object.freeze({
    insert,
    findAll,
    findById,
    getMaxId,
    deleteById,
    findByHash,
    findByName,
    updateById,
    findSubCategories,
    findParentCategories,
  });
  return categoryDb;

  // -------------- db methods ----------------------------------------
  async function updateById(arg: QM_Arguments["updateById"]) {
    const { edited, id } = arg;

    await db.prepare({
      overrideIfExists: false,
      name: PREPARED_QUERY_NAMES.updateById,
      statement: PREPARED_QUERY_STATEMENTS.updateById,
    });

    await db.runPrepared({
      statementArgs: { ...edited, id },
      name: PREPARED_QUERY_NAMES.updateById,
    });
  }

  async function deleteById(arg: QM_Arguments["deleteById"]) {
    await db.prepare({
      overrideIfExists: false,
      name: PREPARED_QUERY_NAMES.deleteById,
      statement: PREPARED_QUERY_STATEMENTS.deleteById,
    });

    const { id } = arg;

    const parentCategory = await findById({ id });

    if (!parentCategory)
      throw new EPP({
        code: "NOT_FOUND",
        message: `No category exists with the id: "${id}"`,
      });

    const subCategories = await findSubCategories({ parentId: id });

    await db.runPrepared({
      name: PREPARED_QUERY_NAMES.deleteById,
      statementArgs: { id },
    });

    return [parentCategory, ...subCategories];
  }

  async function findSubCategories(arg: QM_Arguments["findSubCategories"]) {
    await db.prepare({
      overrideIfExists: false,
      name: PREPARED_QUERY_NAMES.findSubCategories,
      statement: PREPARED_QUERY_STATEMENTS.findSubCategories,
    });

    const subCategories = await db.executePrepared({
      name: PREPARED_QUERY_NAMES.findSubCategories,
      statementArgs: { parentId: Number(arg.parentId) },
    });

    for (const categoryRecord of subCategories) {
      normalize(categoryRecord);
      validate(categoryRecord);
    }

    return subCategories as CategoryFields[];
  }

  async function findParentCategories(
    arg: QM_Arguments["findParentCategories"]
  ) {
    await db.prepare({
      overrideIfExists: false,
      name: PREPARED_QUERY_NAMES.findParentCategories,
      statement: PREPARED_QUERY_STATEMENTS.findParentCategories,
    });

    const parentCategories = await db.executePrepared({
      name: PREPARED_QUERY_NAMES.findParentCategories,
      statementArgs: { id: Number(arg.id) },
    });

    for (const categoryRecord of parentCategories) {
      normalize(categoryRecord);
      validate(categoryRecord);
    }

    return parentCategories as CategoryFields[];
  }

  async function findAll() {
    await db.prepare({
      overrideIfExists: false,
      name: PREPARED_QUERY_NAMES.findAll,
      statement: PREPARED_QUERY_STATEMENTS.findAll,
    });

    const allCategories = await db.executePrepared({
      name: PREPARED_QUERY_NAMES.findAll,
    });

    for (const categoryRecord of allCategories) {
      normalize(categoryRecord);
      validate(categoryRecord);
    }

    return allCategories as CategoryFields[];
  }

  async function findByHash(arg: QM_Arguments["findByHash"]) {
    await db.prepare({
      overrideIfExists: false,
      name: PREPARED_QUERY_NAMES.findByHash,
      statement: PREPARED_QUERY_STATEMENTS.findByHash,
    });

    const result = await db.executePrepared({
      name: PREPARED_QUERY_NAMES.findByHash,
      statementArgs: { hash: arg.hash },
    });

    return processSingleValueReturningQueryResult({
      result,
      multipleRecordsErrorMessage: `Multiple records with the same hash in table: "${TABLE_NAME}"`,
    });
  }

  async function findByName(arg: QM_Arguments["findByName"]) {
    await db.prepare({
      overrideIfExists: false,
      name: PREPARED_QUERY_NAMES.findByName,
      statement: PREPARED_QUERY_STATEMENTS.findByName,
    });

    const categories = await db.executePrepared({
      name: PREPARED_QUERY_NAMES.findByName,
      statementArgs: { name: arg.name },
    });

    categories.forEach((category) => {
      normalize(category);
      validate(category);
    });

    return categories as CategoryFields[];
  }

  async function insert(category: QM_Arguments["insert"]) {
    await db.prepare({
      overrideIfExists: false,
      name: PREPARED_QUERY_NAMES.insert,
      statement: PREPARED_QUERY_STATEMENTS.insert,
    });

    await db.runPrepared({
      name: PREPARED_QUERY_NAMES.insert,
      statementArgs: {
        ...category,
        id: Number(category.id),
        parentId: Number(category.parentId) || null,
      },
    });

    return { ...category };
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
      multipleRecordsErrorMessage: `Foreign key constraint violation in table: "${TABLE_NAME}"`,
    });
  }

  function normalize(record: any) {
    if (Number.isInteger(record.id)) record.id = record.id.toString();
    if (Number.isInteger(record.parentId))
      record.parentId = record.parentId.toString();
    Object.freeze(record);
  }

  function validate(record: any): asserts record is CategoryFields {
    try {
      assertValidCategory(record);
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
