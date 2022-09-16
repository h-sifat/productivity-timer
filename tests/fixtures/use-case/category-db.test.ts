import Category from "entities/category";
import { CategoryFields } from "entities/category/category";
import CategoryDatabase from "./category-db";

const db = new CategoryDatabase();

beforeEach(async () => {
  await db.clearDb();
});

describe("findByHash", () => {
  {
    const errorCode = "MISSING_HASH";
    it(`throws ewc "${errorCode}" if hash is missing`, async () => {
      expect.assertions(1);

      try {
        // @ts-ignore
        await db.findByHash({});
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  {
    const errorCode = "INVALID_HASH";
    it(`throws ewc "${errorCode}" if hash is not a non_empty_string`, async () => {
      expect.assertions(1);

      try {
        await db.findByHash({ hash: "" });
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  it(`returns null if no document is found with the given hash`, async () => {
    // db is empty
    expect(await db.findByHash({ hash: "blabla" })).toBeNull();
  });

  it(`returns the document with the given hash`, async () => {
    const category = Category.make({ name: "study" });

    await db.insert(category);

    expect(await db.findByHash({ hash: category.hash })).toEqual(category);
  });
});

describe('The "hash" field is unique', () => {
  it(`should not allow inserting two documents with the same hash`, async () => {
    expect.assertions(2);

    const documentA = Category.make({ name: "study" });
    const documentB = { ...documentA, id: String(+documentA.id + 1) };

    expect(documentA.hash).toBe(documentB.hash);

    try {
      await db.insertMany([documentA, documentB]);
    } catch (ex) {
      expect(ex.code).toBe("DUPLICATE_HASH");
    }
  });
});

describe("findParentCategories", () => {
  const categoryIdSortPredicate = (
    catA: CategoryFields,
    catB: CategoryFields
  ) => +catA.id - +catB.id;

  const study = Category.make({ name: "study" });
  const programming = Category.make({
    name: "programming",
    parentId: study.id,
  });
  const backend = Category.make({ name: "Backend", parentId: programming.id });

  const PARENT_CATEGORIES = [study, programming, backend].sort(
    categoryIdSortPredicate
  );

  const CHILD_CATEGORY = Category.make({
    name: "Node.js",
    parentId: backend.id,
  });

  /*
   * Category structure:
   *
   * study
   *    |--- programming
   *            |--- Backend
   *                    |--- Node.js
   * */

  it(`returns all the parents recursively if the "recursive" is true`, async () => {
    await db.insertMany([...PARENT_CATEGORIES, CHILD_CATEGORY]);

    const parents = await db.findParentCategories({
      id: CHILD_CATEGORY.id,
      recursive: true,
    });

    expect(parents).toHaveLength(3);

    expect(parents.sort(categoryIdSortPredicate)).toEqual(PARENT_CATEGORIES);
  });

  it(`only returns the first parent if the "recursive" flag is false`, async () => {
    await db.insertMany([...PARENT_CATEGORIES, CHILD_CATEGORY]);

    const parents = await db.findParentCategories({
      id: CHILD_CATEGORY.id,
      recursive: false,
    });

    expect(parents).toHaveLength(1);
    expect(parents[0].id).toBe(CHILD_CATEGORY.parentId);
  });
});
