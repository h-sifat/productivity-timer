import type SqliteDatabase from "./db/mainprocess-db";
import type {
  CategoryFields,
  CategoryValidator,
} from "entities/category/category";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import type { QueryMethodArguments as QM_Arguments } from "use-cases/interfaces/category-db";

import EPP from "common/util/epp";
import Category from "entities/category";

const assertValidCategory: CategoryValidator["validate"] =
  Category.validator.validate;

const TABLE_NAME = "categories";

const PREPARED_QUERY_NAMES = Object.freeze({
  insert: "cat/insert",
  findAll: "cat/findAll",
  findById: "cat/findById",
  findByHash: "cat/findByHash",
  findParentCategories: "cat/findParentCategories",
});

const PREPARED_QUERY_STATEMENTS: {
  [key in keyof typeof PREPARED_QUERY_NAMES]: string;
} = Object.freeze({
  findAll: `select * from ${TABLE_NAME};`,
  findById: `select * from ${TABLE_NAME} where id=$id;`,
  findByHash: `select * from ${TABLE_NAME} where hash=$hash;`,

  insert: `insert into ${TABLE_NAME}
  ( id, name, hash, parentId, createdAt, description)
  values ( $id, $name, $hash, $parentId, $createdAt, $description);`,

  /*
   * @WARNING:
   * do not change the order of column names!
   * */
  findParentCategories: `with recursive
  parent_categories(id, name, parentId, hash, createdAt, description) as (
  select
    id, name, parentId, hash, createdAt, description
  from categories where id = (
    select parentId from categories
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
  from categories as c
  inner join parent_categories as pc
    on c.id = pc.parentId
)
select * from parent_categories;`,
});

interface BuildCategoryDatabase_Argument {
  db: SqliteDatabase;
}
export default function buildCategoryDatabase(
  builderArg: BuildCategoryDatabase_Argument
): Partial<CategoryDatabaseInterface> {
  const { db } = builderArg;

  // @ts-ignore
  const categoryDb: CategoryDatabaseInterface = {
    insert,
    findAll,
    findById,
    findByHash,
    // @ts-ignore
    findParentCategories,
  };

  return categoryDb;

  async function findParentCategories(
    arg: QM_Arguments["findParentCategories"]
  ) {
    await prepareQueryIfNotPrepared({
      db,
      queryMethod: "findParentCategories",
    });

    await db.execute({ sql: "begin immediate;" });

    const parentCategories = await db.executePrepared({
      name: PREPARED_QUERY_NAMES.findParentCategories,
      statementArgs: { id: Number(arg.id) },
    });

    await db.execute({ sql: "commit;" });

    for (const category of parentCategories)
      validateAndNormalizeCategoryRecord(category);

    return parentCategories;
  }

  async function findAll() {
    await prepareQueryIfNotPrepared({ queryMethod: "findAll", db });

    const allCategories = await db.executePrepared({
      name: PREPARED_QUERY_NAMES.findAll,
    });

    for (const category of allCategories)
      validateAndNormalizeCategoryRecord(category);

    return allCategories as CategoryFields[];
  }

  async function findByHash(arg: QM_Arguments["findByHash"]) {
    await prepareQueryIfNotPrepared({ queryMethod: "findByHash", db });

    const results = await db.executePrepared({
      name: PREPARED_QUERY_NAMES.findByHash,
      statementArgs: { hash: arg.hash },
    });

    switch (results.length) {
      case 0:
        return null;
      case 1: {
        const category = results[0];
        validateAndNormalizeCategoryRecord(category);
        return category;
      }

      default:
        throw new EPP({
          message: `The database is corrupted. Multiple records with the same hash in table: "${TABLE_NAME}"`,
          code: "DB_CORRUPTED",
        });
    }
  }

  async function insert(category: QM_Arguments["insert"]) {
    await prepareQueryIfNotPrepared({ queryMethod: "insert", db });

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
    await prepareQueryIfNotPrepared({ queryMethod: "findById", db });

    const results = await db.executePrepared({
      name: PREPARED_QUERY_NAMES.findById,
      statementArgs: { id: Number(arg.id) },
    });

    switch (results.length) {
      case 0:
        return null;
      case 1: {
        const category = results[0];
        validateAndNormalizeCategoryRecord(category);
        return category;
      }

      default:
        throw new EPP({
          message: `The database is corrupted. Foreign key constraint violation in table: "${TABLE_NAME}"`,
          code: "DB_CORRUPTED",
        });
    }
  }
}

function validateAndNormalizeCategoryRecord(
  record: any
): asserts record is CategoryFields {
  if (Number.isInteger(record.id)) record.id = record.id.toString();
  if (Number.isInteger(record.parentId))
    record.parentId = record.parentId.toString();

  try {
    assertValidCategory(record);
  } catch (ex) {
    throw new EPP({
      code: "DB_CORRUPTED",
      otherInfo: { record },
      message: `The ${TABLE_NAME} table contains invalid category record(s).`,
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
