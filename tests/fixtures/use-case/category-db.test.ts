import Category from "entities/category";
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
    const category = new Category({ name: "study" }).toPlainObject();

    await db.insert(category);

    expect(await db.findByHash({ hash: category.hash })).toEqual(category);
  });
});

describe('The "hash" field is unique', () => {
  it(`should not allow inserting two documents with the same hash`, async () => {
    expect.assertions(2);

    const documentA = new Category({ name: "study" }).toPlainObject();
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
  // @ts-ignore
  const PARENT_CATEGORIES = [
    { id: "1", name: "study" },
    { id: "100", name: "programming", parentId: "1" },
    { id: "200", name: "Backend", parentId: "100" },
  ].map((catInfo) => new Category(catInfo).toPlainObject());

  // @ts-ignore
  const CHILD_CATEGORY = new Category({
    id: "300",
    name: "Node.js",
    parentId: "200",
  }).toPlainObject();

  /*
   * Category structure:
   *
   * study
   *    |--- programming
   *            |--- Backend
   *                    |--- Node.js
   * */

  it(`returns [null] if the child has a parentId but parent does not exist`, async () => {
    const category = new Category({
      name: "study",
      parentId: "2342",
    }).toPlainObject();

    await db.insert(category);

    const parents = await db.findParentCategories({ id: category.id });
    expect(parents).toEqual([null]);
  });

  it(`returns all the parents recursively if the "recursive" is true`, async () => {
    await db.insertMany([...PARENT_CATEGORIES, CHILD_CATEGORY]);

    const parents = await db.findParentCategories({
      id: CHILD_CATEGORY.id,
      recursive: true,
    });

    expect(parents.reverse()).toEqual(PARENT_CATEGORIES);
  });

  it(`only returns the first parent if the "recursive" flag is false`, async () => {
    await db.insertMany([...PARENT_CATEGORIES, CHILD_CATEGORY]);

    const parents = await db.findParentCategories({
      id: CHILD_CATEGORY.id,
      recursive: false,
    });

    expect(parents).toHaveLength(1);
    expect(parents[0]!.id).toBe(CHILD_CATEGORY.parentId);
  });
});
