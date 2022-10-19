import type {
  CategoryFields,
  CategoryValidator,
} from "entities/category/category";
import type SqliteDatabase from "./db/mainprocess-db";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import type { QueryMethodArguments as QM_Arguments } from "use-cases/interfaces/category-db";

import EPP from "common/util/epp";
import Category from "entities/category";
import { makeProcessSingleValueReturningQueryResult } from "./util";

const assertValidCategory: CategoryValidator["validate"] =
  Category.validator.validate;

const TABLE_NAME = "categories";

const preparedQueryNames = Object.freeze({
  insert: "cat/insert",
  findAll: "cat/findAll",
  findById: "cat/findById",
  updateById: "cat/updateById",
  findByHash: "cat/findByHash",
  deleteById: "cat/deleteById",
  findSubCategories: "cat/findSubCategories",
  findParentCategories: "cat/findParentCategories",
});

const preparedQueryStatements: {
  [key in keyof typeof preparedQueryNames]: string;
} = Object.freeze({
  findAll: `select * from ${TABLE_NAME};`,
  findById: `select * from ${TABLE_NAME} where id=$id;`,
  findByHash: `select * from ${TABLE_NAME} where hash=$hash;`,

  deleteById: `delete from ${TABLE_NAME} where id = ($id);`,

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
  notifyDatabaseCorruption: (arg: any) => void;
}
export default function buildCategoryDatabase(
  builderArg: BuildCategoryDatabase_Argument
): CategoryDatabaseInterface {
  const { db, notifyDatabaseCorruption } = builderArg;
  const processSingleValueReturningQueryResult =
    makeProcessSingleValueReturningQueryResult<CategoryFields>({
      validate,
      normalize,
      tableName: TABLE_NAME,
      notifyDatabaseCorruption,
    });

  const categoryDb: CategoryDatabaseInterface = Object.freeze({
    insert,
    findAll,
    findById,
    deleteById,
    findByHash,
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
      name: preparedQueryNames.updateById,
      statement: preparedQueryStatements.updateById,
    });

    await db.runPrepared({
      statementArgs: { ...edited, id },
      name: preparedQueryNames.updateById,
    });
  }

  async function deleteById(arg: QM_Arguments["deleteById"]) {
    await db.prepare({
      overrideIfExists: false,
      name: preparedQueryNames.deleteById,
      statement: preparedQueryStatements.deleteById,
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
      name: preparedQueryNames.deleteById,
      statementArgs: { id },
    });

    return [parentCategory, ...subCategories];
  }

  async function findSubCategories(arg: QM_Arguments["findSubCategories"]) {
    await db.prepare({
      overrideIfExists: false,
      name: preparedQueryNames.findSubCategories,
      statement: preparedQueryStatements.findSubCategories,
    });

    const subCategories = await db.executePrepared({
      name: preparedQueryNames.findSubCategories,
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
      name: preparedQueryNames.findParentCategories,
      statement: preparedQueryStatements.findParentCategories,
    });

    const parentCategories = await db.executePrepared({
      name: preparedQueryNames.findParentCategories,
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
      name: preparedQueryNames.findAll,
      statement: preparedQueryStatements.findAll,
    });

    const allCategories = await db.executePrepared({
      name: preparedQueryNames.findAll,
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
      name: preparedQueryNames.findByHash,
      statement: preparedQueryStatements.findByHash,
    });

    const result = await db.executePrepared({
      name: preparedQueryNames.findByHash,
      statementArgs: { hash: arg.hash },
    });

    return processSingleValueReturningQueryResult({
      result,
      multipleRecordsErrorMessage: `Multiple records with the same hash in table: "${TABLE_NAME}"`,
    });
  }

  async function insert(category: QM_Arguments["insert"]) {
    await db.prepare({
      overrideIfExists: false,
      name: preparedQueryNames.insert,
      statement: preparedQueryStatements.insert,
    });

    await db.runPrepared({
      name: preparedQueryNames.insert,
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
      name: preparedQueryNames.findById,
      statement: preparedQueryStatements.findById,
    });

    const result = await db.executePrepared({
      name: preparedQueryNames.findById,
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
