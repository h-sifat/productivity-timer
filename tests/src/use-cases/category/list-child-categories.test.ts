import getID from "src/date-access/id";
import Category from "entities/category";
import makeCategoryIfNotCorrupted from "use-cases/category/util";
import { getCategoryDatabase } from "fixtures/use-case/category-db";
import makeListSubCategories from "use-cases/category/list-sub-categories";

const db = getCategoryDatabase();
const Id = getID({ entity: "category" });

const listSubCategories = makeListSubCategories({
  Id,
  db,
  makeCategoryIfNotCorrupted,
});

afterEach(() => {
  db._clearDb_();
});

describe("Validation", () => {
  {
    const errorCode = "INVALID_PARENT_ID";

    it(`returns ewc "${errorCode} if parentId is not valid" `, async () => {
      expect.assertions(2);

      const invalidParentId = "0"; // not a positive integer
      expect(Id.isValid(invalidParentId)).toBeFalsy();

      try {
        // @ts-ignore
        await listSubCategories({ id: invalidParentId });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }
});

describe("Functionality", () => {
  const parentCategory = new Category({ id: "1", name: "study" });

  const subCategories = [
    { id: "2", name: "programming", parentId: "1" },
    { id: "100", name: "DSA", parentId: "2" },
    { id: "101", name: "Backend", parentId: "2" },

    { id: "3", name: "academic", parentId: "1" },
    { id: "102", name: "math", parentId: "3" },
    { id: "103", name: "english", parentId: "3" },
  ].map((catInfo) => new Category(catInfo));

  /*
   * Category structure:
   *
   * study
   *    |--- programming
   *    |       |--- DSA
   *    |       |--- Backend
   *    |--- academic
   *            |--- math
   *            |--- english
   * */

  // populate the db
  beforeEach(() => {
    const store = db._getStore_();

    const allCategoryRecords = [parentCategory, ...subCategories].map((cat) =>
      cat.toPlainObject()
    );
    for (const catRecord of allCategoryRecords) store[catRecord.id] = catRecord;
  });

  it(`returns an empty array for the children field if no child is found for the given parentId`, async () => {
    {
      const store = db._getStore_();

      for (const categoryRecord of Object.values(store))
        if (categoryRecord.id !== parentCategory.id)
          delete store[categoryRecord.id];
    }
    // right now no direct sub category should exist in db

    const children = await listSubCategories({ id: parentCategory.id });

    expect(children).toEqual({
      subCategories: [],
      corruptionError: [],
    });
  });

  it(`returns only the direct sub categories for the given parentId if "recursive" flag is false`, async () => {
    const { subCategories, corruptionError } = await listSubCategories({
      id: parentCategory.id,
    });

    expect(corruptionError).toHaveLength(0);

    subCategories.forEach((cat) => {
      expect(cat.parentId).toBe(parentCategory.id);
    });
  });

  it(`returns all children recursively if the "recursive" flag is true`, async () => {
    const { subCategories: subCategoryResults, corruptionError } =
      await listSubCategories({
        recursive: true,
        id: parentCategory.id,
      });

    expect(corruptionError).toHaveLength(0);

    const subCategoryRecordsFromResult = subCategoryResults.map((subCat) =>
      subCat.toPlainObject()
    );
    const insertedSubCategoryRecords = subCategories.map((subCat) =>
      subCat.toPlainObject()
    );

    expect(insertedSubCategoryRecords).toEqual(subCategoryRecordsFromResult);
  });
});
