import { isValid as isValidId } from "common/util/id";
import Category from "entities/category";
import CategoryDatabase from "fixtures/use-case/category-db";
import makeRemoveCategories from "use-cases/category/remove-categories";

const db = new CategoryDatabase();
const removeCategories = makeRemoveCategories({ db, isValidId });

const parentId = "1";
const INSERTED_CATEGORY_RECORDS = [
  { id: parentId, name: "study" },
  { id: "100", name: "programming", parentId },
  { id: "200", name: "dsa", parentId: "100" },
].map((catInfo) => new Category(catInfo).toPlainObject());

beforeEach(async () => {
  await db.insertMany(INSERTED_CATEGORY_RECORDS);
});

afterEach(async () => {
  await db.clearDb();
});

describe("Validation", () => {
  {
    const errorCode = "INVALID_ID";

    it(`throws ewc "${errorCode}" if the given id is invalid`, async () => {
      expect.assertions(2);

      const invalidId = "non_numeric_string";
      expect(isValidId(invalidId)).toBeFalsy();

      try {
        await removeCategories({ id: invalidId });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  {
    const errorCode = "CATEGORY_DOES_NOT_EXIST";

    it(`throws ewc "${errorCode}" if no category exists with the given id`, async () => {
      expect.assertions(1);

      await db.clearDb();
      // currently our db is empty

      try {
        await removeCategories({ id: "123" });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  {
    const errorCode = "CATEGORY_HAS_CHILDREN";
    it(`throws ewc "${errorCode}" if category has children and "removeChildrenRecursively" flag is false`, async () => {
      expect.assertions(1);

      try {
        await removeCategories({
          id: parentId,
          removeChildrenRecursively: false,
        });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }
});

describe("Functionality", () => {
  it(`removes a category if it has not children`, async () => {
    expect.assertions(3);
    const category = new Category({ name: "work" }).toPlainObject();

    await db.clearDb();
    await db.insert(category);

    {
      const deletedCategories = await removeCategories({ id: category.id });

      expect(deletedCategories).toHaveLength(1);
      expect(deletedCategories.pop()).toEqual(category);
    }

    try {
      // the category is already deleted so it should throw an error
      await removeCategories({ id: category.id });
    } catch (ex: any) {
      expect(ex.code).toBe("CATEGORY_DOES_NOT_EXIST");
    }
  });

  it(`removes the category along with all of its sub categories if "removeChildrenRecursively" flag is true`, async () => {
    const deletedCategoryRecords = await removeCategories({
      id: parentId,
      removeChildrenRecursively: true,
    });

    expect(deletedCategoryRecords).toEqual(INSERTED_CATEGORY_RECORDS);
  });
});
