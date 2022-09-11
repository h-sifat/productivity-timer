import getID from "src/date-access/id";
import categoryFixture from "fixtures/category";
import makeAddCategory from "use-cases/category/add-category";
import { getCategoryDatabase } from "fixtures/use-case/category-db";
import { CategoryConstructor_Argument } from "entities/category/category";
import makeCategoryIfNotCorrupted from "use-cases/category/util";

const Id = getID({ entity: "category" });

const db = getCategoryDatabase();
const addCategory = makeAddCategory({ db, makeCategoryIfNotCorrupted });

let categoryInfo: Required<CategoryConstructor_Argument>;

beforeEach(() => {
  categoryInfo = categoryFixture();
  db._clearDb_();
});

describe("Insertion", () => {
  it("inserts a category object", async () => {
    const { name, description } = categoryInfo;
    const inserted = await addCategory({ categoryInfo: { name, description } });

    expect(inserted).toMatchObject({
      name,
      description,
      parentId: null,
      id: expect.any(String),
      hash: expect.any(String),
      createdOn: expect.any(Number),
      modifiedOn: expect.any(Number),
    });

    expect(inserted.modifiedOn).toBe(inserted.createdOn);
  });

  it("throws error if category info is invalid", async () => {
    expect.assertions(1);

    const { description } = categoryInfo;

    try {
      // @ts-expect-error name field is missing
      await addCategory({ categoryInfo: { description } });
    } catch (ex: any) {
      expect(ex.code).toBe("MISSING_NAME");
    }
  });

  it(`doesn't insert the same category twice if name and parentId is the same`, async () => {
    const name = "study";
    const descriptionBefore = "Before";
    const descriptionAfter = "After";

    const insertedBefore = await addCategory({
      categoryInfo: { name, description: descriptionBefore },
    });
    const insertedAfter = await addCategory({
      // adding some whitespace in name
      categoryInfo: { name: `    ${name}  `, description: descriptionAfter },
    });

    expect(insertedBefore).toEqual(insertedAfter);
  });

  {
    const errorCode = "PARENT_DOES_NOT_EXIST";

    it(`throws ewc "${errorCode}" if a category has a non null parentId and that parent doesn't exist`, async () => {
      expect.assertions(2);

      const { name, description, parentId } = categoryInfo;

      expect(parentId).not.toBeNull();

      try {
        await addCategory({ categoryInfo: { name, description, parentId } });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }
});

describe("CorruptionHandling", () => {
  {
    const errorCode = "CATEGORY_CORRUPTED_IN_DB";

    it(`throws error with code "${errorCode}" if the database returns corrupted data`, async () => {
      expect.assertions(2);

      const { name, description } = categoryInfo;
      const insertedBefore = await addCategory({
        categoryInfo: { name, description },
      });

      const id = insertedBefore.id;

      {
        const corruptedId = "non_numeric_string";
        expect(Id.isValid(corruptedId)).toBeFalsy();

        const _db_store_ = db._getStore_();
        _db_store_[id] = { ..._db_store_[id], id: corruptedId };
      }

      try {
        // inserting the same category again
        await addCategory({ categoryInfo: { name, description } });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  {
    const errorCode = "CATEGORY_CORRUPTED_IN_DB";

    it(`throws ewc "${errorCode}" if category created from existing data in db doesn't generate the same hash`, async () => {
      expect.assertions(1);

      const { name, description } = categoryInfo;
      const insertedBefore = await addCategory({
        categoryInfo: { name, description },
      });

      {
        const id = insertedBefore.id;
        const name = insertedBefore.name;

        const _db_store_ = db._getStore_();
        // changing the name. so the generated hash will be different
        _db_store_[id] = { ..._db_store_[id], name: name + "_changed_" };
      }

      try {
        // inserting the same category again
        await addCategory({ categoryInfo: { name, description } });
      } catch (ex: any) {
        expect(ex.code).toBe("CATEGORY_CORRUPTED_IN_DB");
      }
    });
  }
});
