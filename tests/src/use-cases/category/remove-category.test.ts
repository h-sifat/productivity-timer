import Category from "entities/category";
import { isValid as isValidId } from "common/util/id";
import CategoryDatabase from "fixtures/use-case/category-db";
import makeRemoveCategory from "use-cases/category/remove-category";

const db = new CategoryDatabase();
const removeCategories = makeRemoveCategory({ db, isValidId });

const { INSERTED_CATEGORY_RECORDS, parentId } = (() => {
  const parent = Category.make({ name: "study" });

  const subCategories = [
    { name: "dsa", parentId: parent.id },
    { name: "programming", parentId: parent.id },
  ].map((catInfo) => Category.make(catInfo));

  return {
    parentId: parent.id,
    INSERTED_CATEGORY_RECORDS: [parent, ...subCategories],
  };
})();

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
    const errorCode = "NOT_FOUND";

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
  it(`removes a category if it has no children`, async () => {
    expect.assertions(3);
    const category = Category.make({ name: "work" });

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
      expect(ex.code).toBe("NOT_FOUND");
    }
  });

  it(`removes the category along with all of its sub categories if "removeChildrenRecursively" flag is true`, async () => {
    const deletedCategoryRecords = await removeCategories({
      id: parentId,
      removeChildrenRecursively: true,
    });

    expect(deletedCategoryRecords).toEqual(INSERTED_CATEGORY_RECORDS);

    for (const deletedCategory of deletedCategoryRecords)
      try {
        // the category is already deleted so it should throw an error
        await removeCategories({ id: deletedCategory.id });
      } catch (ex: any) {
        expect(ex.code).toBe("NOT_FOUND");
      }
  });
});
