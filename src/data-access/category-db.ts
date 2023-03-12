import type {
  CategoryFields,
  CategoryValidator,
} from "entities/category/category";
import type { Database as SqliteDatabase } from "better-sqlite3";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import type { QueryMethodArguments as QM_Arguments } from "use-cases/interfaces/category-db";

import {
  makeGetMaxId,
  prepareQueries,
  asyncifyDatabaseMethods,
  makeProcessSingleValueReturningQueryResult,
} from "./util";
import EPP from "common/util/epp";
import Category from "entities/category";

const assertValidCategory: CategoryValidator["validate"] =
  Category.validator.validate;

const TABLE_NAME = "categories";
const MAX_ID_COLUMN_NAME = "max_id";

const queries = Object.freeze({
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

  const preparedQueryStatements = prepareQueries({ db, queries });

  // -------------- db methods ----------------------------------------
  const getMaxId = makeGetMaxId({
    db,
    idFieldName: "id",
    tableName: TABLE_NAME,
  });

  function updateById(arg: QM_Arguments["updateById"]) {
    const { edited, id } = arg;
    preparedQueryStatements.updateById.run({ ...edited, id });
  }

  const deleteTransaction = db.transaction((arg: { id: string }) => {
    const { id } = arg;
    const parentCategory = findById({ id });

    if (!parentCategory)
      throw new EPP({
        code: "NOT_FOUND",
        message: `No category exists with the id: "${id}"`,
      });

    const subCategories = findSubCategories({ parentId: id });

    preparedQueryStatements.deleteById.run({ id });

    return [parentCategory, ...subCategories];
  });

  function deleteById(arg: QM_Arguments["deleteById"]) {
    return deleteTransaction.exclusive({ id: arg.id });
  }

  const findSubCategoriesTransaction = db.transaction(
    (arg: { parentId: string }) =>
      preparedQueryStatements.findSubCategories.all({
        parentId: Number(arg.parentId),
      })
  );
  function findSubCategories(arg: QM_Arguments["findSubCategories"]) {
    const subCategories = findSubCategoriesTransaction.immediate({
      parentId: arg.parentId,
    });

    for (const categoryRecord of subCategories) {
      normalize(categoryRecord);
      validate(categoryRecord);
    }

    return subCategories as CategoryFields[];
  }

  const findParentCategoriesTransaction = db.transaction(
    (arg: { id: string }) =>
      preparedQueryStatements.findParentCategories.all({
        id: Number(arg.id),
      })
  );

  function findParentCategories(arg: QM_Arguments["findParentCategories"]) {
    const parentCategories = findParentCategoriesTransaction.immediate({
      id: arg.id,
    });

    for (const categoryRecord of parentCategories) {
      normalize(categoryRecord);
      validate(categoryRecord);
    }

    return parentCategories as CategoryFields[];
  }

  function findAll() {
    const categories = preparedQueryStatements.findAll.all();

    for (const categoryRecord of categories) {
      normalize(categoryRecord);
      validate(categoryRecord);
    }

    return categories as CategoryFields[];
  }

  async function findByHash(arg: QM_Arguments["findByHash"]) {
    const result = preparedQueryStatements.findByHash.all({ hash: arg.hash });

    return processSingleValueReturningQueryResult({
      result,
      multipleRecordsErrorMessage: `Multiple records with the same hash in table: "${TABLE_NAME}"`,
    });
  }

  async function findByName(arg: QM_Arguments["findByName"]) {
    const categories = preparedQueryStatements.findByName.all({
      name: arg.name,
    });

    categories.forEach((category) => {
      normalize(category);
      validate(category);
    });

    return categories as CategoryFields[];
  }

  async function insert(category: QM_Arguments["insert"]) {
    preparedQueryStatements.insert.run({
      ...category,
      id: Number(category.id),
      parentId: Number(category.parentId) || null,
    });

    return { ...category };
  }

  function findById(arg: QM_Arguments["findById"]) {
    const result = preparedQueryStatements.findById.all({ id: Number(arg.id) });

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

  const categoryDb = Object.freeze(
    asyncifyDatabaseMethods({
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
    })
  );

  return Object.freeze(categoryDb);
}
