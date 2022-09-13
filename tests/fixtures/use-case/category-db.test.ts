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
