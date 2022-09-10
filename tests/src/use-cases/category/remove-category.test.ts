import { isValid as isValidId } from "common/util/id";
import Category from "entities/category";
import { getCategoryDatabase } from "fixtures/use-case/category-db";
import makeRemoveCategory from "use-cases/category/remove-category";

const db = getCategoryDatabase();
const removeCategory = makeRemoveCategory({ db, isValidId });

const parentId = "1";
const insertedCategoryRecords = [
  { id: parentId, name: "study" },
  { id: "2", name: "programming", parentId },
  { id: "3", name: "dsa", parentId: "2" },
].map((catInfo) => new Category(catInfo).toPlainObject());

beforeEach(() => {
  const store = db._getStore_();
  for (const categoryRecord of insertedCategoryRecords)
    store[categoryRecord.id] = categoryRecord;
});

afterEach(() => {
  db._clearDb_();
});

describe("Validation", () => {
  {
    const errorCode = "INVALID_ID";

    it(`throws ewc "${errorCode}" if the given id is invalid`, async () => {
      expect.assertions(2);

      const invalidId = "non_numeric_string";
      expect(isValidId(invalidId)).toBeFalsy();

      try {
        await removeCategory({ id: invalidId });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  {
    const errorCode = "CATEGORY_DOES_NOT_EXIST";

    it(`throws ewc "${errorCode}" if no category exists with the given id`, async () => {
      expect.assertions(1);

      db._clearDb_();
      // currently our db is empty

      try {
        await removeCategory({ id: "123" });
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
        await removeCategory({
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
    const category = new Category({ name: "work" });
    {
      db._clearDb_();

      const store = db._getStore_();
      store[category.id] = category.toPlainObject();
    }

    {
      const deletedCategories = await removeCategory({ id: category.id });

      expect(deletedCategories).toHaveLength(1);
      expect(deletedCategories.pop()).toEqual(category.toPlainObject());
    }

    try {
      // the category is already deleted so it should throw an error
      await removeCategory({ id: category.id });
    } catch (ex: any) {
      expect(ex.code).toBe("CATEGORY_DOES_NOT_EXIST");
    }
  });

  it(`removes the category along with all of its sub categories if "removeChildrenRecursively" flag is true`, async () => {
    const deletedCategoryRecords = await removeCategory({
      id: parentId,
      removeChildrenRecursively: true,
    });

    expect(deletedCategoryRecords).toEqual(insertedCategoryRecords);
  });
});
