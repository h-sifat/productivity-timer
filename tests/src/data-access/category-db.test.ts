import Category from "entities/category";
import SqliteDatabase from "data-access/db/mainprocess-db";
import buildCategoryDatabase from "data-access/category-db";
import { CategoryFields } from "entities/category/category";
import type CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import { initializeDatabase } from "data-access/init-db";
import { makeGetMaxId } from "data-access/util";
import { makeDbSubProcess } from "data-access/db";

const IN_MEMORY_DB_PATH = ":memory:";
const SAMPLE_HIERARCHICAL_CATEGORIES = (function () {
  const study = Category.make({ name: "study" });
  const academic = Category.make({ name: "Academic", parentId: study.id });
  const math = Category.make({ name: "Math", parentId: academic.id });
  const english = Category.make({ name: "English", parentId: academic.id });

  return Object.freeze({ study, academic, math, english });
})();
const CATEGORY_SORT_PREDICATE = (a: CategoryFields, b: CategoryFields) =>
  +a.id - +b.id;

const _internalDb_ = new SqliteDatabase({
  makeDbSubProcess,
  dbCloseTimeoutMsWhenKilling: 30,
  sqliteDbPath: IN_MEMORY_DB_PATH,
});

let categoryDb: CategoryDatabaseInterface;

// -----    Test setup -----------------
beforeEach(async () => {
  await _internalDb_.open({ path: IN_MEMORY_DB_PATH });
  await initializeDatabase(_internalDb_);

  if (!categoryDb)
    categoryDb = buildCategoryDatabase({
      makeGetMaxId,
      db: _internalDb_,
      notifyDatabaseCorruption: () => {},
    });
});

afterEach(async () => {
  await _internalDb_.close();
});

afterAll(async () => {
  await _internalDb_.kill();
});
// -----    Test setup -----------------

describe("getMaxId", () => {
  it(`returns 1 if db is empty`, async () => {
    // currently our db is empty
    const maxId = await categoryDb.getMaxId();
    expect(maxId).toBe(1);
  });

  it(`returns the maxId (i.e., lastInsertRowId)`, async () => {
    const id = 123;
    const category = (() => {
      return { ...Category.make({ name: "a" }), id: id.toString() };
    })();

    await categoryDb.insert(category);

    const maxId = await categoryDb.getMaxId();
    expect(maxId).toBe(id);
  });
});

describe("findById", () => {
  it(`returns null if no category is found with the given id`, async () => {
    // currently our db is empty
    expect(await categoryDb.findById({ id: "123" })).toBeNull();
  });
});

describe("insert", () => {
  it(`inserts a new category`, async () => {
    const category = Category.make({ name: "study" });

    await categoryDb.insert(category);

    const result = await categoryDb.findById({ id: category.id });
    expect(result).toEqual(category);
  });
});

describe("findByHash", () => {
  it(`returns null if no category is found with the given hash`, async () => {
    // currently our db is empty
    const category = await categoryDb.findByHash({
      hash: "anything_here_db_is_empty",
    });

    expect(category).toBeNull();
  });

  it(`returns the category with the given hash`, async () => {
    const category = Category.make({ name: "study" });

    await categoryDb.insert(category);

    const result = await categoryDb.findByHash({ hash: category.hash });
    expect(result).toEqual(category);
  });
});

describe("findByName", () => {
  it(`returns an empty array if no categories are found`, async () => {
    const categories = await categoryDb.findByName({ name: "study" });
    expect(categories).toEqual([]);
  });

  it(`returns the found category based on case-insensitive search`, async () => {
    const name = "study";
    const category = Category.make({ name });
    await categoryDb.insert(category);

    const categories = await categoryDb.findByName({
      name: name.toUpperCase(),
    });
    expect(categories).toEqual([category]);
  });
});

describe("findAll", () => {
  it(`returns an empty array if no category exists`, async () => {
    const categories = await categoryDb.findAll();
    expect(categories).toEqual([]);
  });

  it(`returns all the inserted categories`, async () => {
    const category = Category.make({ name: "study" });
    await categoryDb.insert(category);

    const allCategories = await categoryDb.findAll();
    expect(allCategories).toEqual([category]);
  });
});

describe("findParentCategories", () => {
  it(`returns an empty array if category has no parent`, async () => {
    const category = Category.make({ name: "study" });
    await categoryDb.insert(category);

    expect(category.parentId).toBeNull();

    const parents = await categoryDb.findParentCategories({ id: category.id });
    expect(parents).toEqual([]);
  });

  it(`returns all the parent categories`, async () => {
    // insert SAMPLE_HIERARCHICAL_CATEGORIES
    await insertMany({
      db: _internalDb_,
      categories: Object.values(SAMPLE_HIERARCHICAL_CATEGORIES),
    });

    const parentOfMathCategory = await categoryDb.findParentCategories({
      id: SAMPLE_HIERARCHICAL_CATEGORIES.math.id,
    });

    expect(parentOfMathCategory).toHaveLength(2);

    const expectedResults = [
      SAMPLE_HIERARCHICAL_CATEGORIES.study,
      SAMPLE_HIERARCHICAL_CATEGORIES.academic,
    ].sort(CATEGORY_SORT_PREDICATE);

    parentOfMathCategory.sort(CATEGORY_SORT_PREDICATE);

    expect(parentOfMathCategory).toEqual(expectedResults);
  });
});

describe("findSubCategories", () => {
  it(`returns an empty array if category has no children`, async () => {
    const category = Category.make({ name: "study" });
    await categoryDb.insert(category);

    const subCategories = await categoryDb.findSubCategories({
      parentId: category.id,
    });
    expect(subCategories).toEqual([]);
  });

  it(`returns all the sub categories`, async () => {
    // insert SAMPLE_HIERARCHICAL_CATEGORIES
    await insertMany({
      db: _internalDb_,
      categories: Object.values(SAMPLE_HIERARCHICAL_CATEGORIES),
    });

    const subCategoriesOfStudy = await categoryDb.findSubCategories({
      parentId: SAMPLE_HIERARCHICAL_CATEGORIES.study.id,
    });

    expect(subCategoriesOfStudy).toHaveLength(3);

    const expectedResults = [
      SAMPLE_HIERARCHICAL_CATEGORIES.academic,
      SAMPLE_HIERARCHICAL_CATEGORIES.math,
      SAMPLE_HIERARCHICAL_CATEGORIES.english,
    ].sort(CATEGORY_SORT_PREDICATE);

    subCategoriesOfStudy.sort(CATEGORY_SORT_PREDICATE);

    expect(subCategoriesOfStudy).toEqual(expectedResults);
  });
});

describe("deleteById", () => {
  it(`it returns the number of item that has been deleted`, async () => {
    const categories = Object.values(SAMPLE_HIERARCHICAL_CATEGORIES);

    await insertMany({ db: _internalDb_, categories: categories });

    const deletedCategories = await categoryDb.deleteById({
      id: SAMPLE_HIERARCHICAL_CATEGORIES.study.id,
    });

    expect(deletedCategories.sort(CATEGORY_SORT_PREDICATE)).toEqual(
      categories.sort(CATEGORY_SORT_PREDICATE)
    );

    for (const { id } of deletedCategories)
      expect(await categoryDb.findById({ id })).toBeNull();
  });
});

describe("updateById", () => {
  it(`edit's a category`, async () => {
    const category = Category.make({ name: "programming" });

    await categoryDb.insert(category);

    const editedCategory = Category.edit({
      category: category,
      changes: {
        name: "Programming",
        description: "Banging my head on the keyboard",
      },
    });

    await categoryDb.updateById({ id: category.id, edited: editedCategory });

    const updated = await categoryDb.findById({ id: category.id });
    expect(updated).toEqual(editedCategory);
  });

  {
    const errorCode = "SQLITE_CONSTRAINT_FOREIGNKEY";

    it(`throws ewc "${errorCode}" if the edited parentId doesn't exist`, async () => {
      const category = Category.make({ name: "programming" });

      await categoryDb.insert(category);

      const nonExistentParentId = String(Number(category.id) + 1);

      const editedCategory = Category.edit({
        category: category,
        changes: { name: "Programming", parentId: nonExistentParentId },
      });

      try {
        await categoryDb.updateById({
          id: category.id,
          edited: editedCategory,
        });
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }
});

// ---- Utility Functions -------
async function insertMany(arg: {
  categories: CategoryFields[];
  db: SqliteDatabase;
}) {
  const { categories, db } = arg;
  await db.execute({ sql: "begin immediate;" });
  for (const category of categories) await categoryDb.insert(category);
  await db.execute({ sql: "commit;" });
}
