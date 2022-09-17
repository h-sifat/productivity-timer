import Category from "entities/category";
import { isValid as isValidId } from "common/util/id";
import { CategoryFields } from "entities/category/category";
import CategoryDatabase from "fixtures/use-case/category-db";
import makeListParentCategories from "use-cases/category/list-parent-categories";

const db = new CategoryDatabase();

const listParentCategories = makeListParentCategories({ db, isValidId });

beforeEach(async () => {
  await db.clearDb();
});

describe("Validation", () => {
  {
    const errorCode = "MISSING_ID";

    it(`throws ewc "${errorCode}" if id is missing`, async () => {
      expect.assertions(1);

      try {
        // @ts-ignore
        await listParentCategories({});
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  {
    const errorCode = "INVALID_ID";

    it(`it throws ewc "${errorCode}" if id is not valid`, async () => {
      expect.assertions(2);

      const invalidId = "non_numeric_string";
      expect(isValidId(invalidId)).toBeFalsy();

      try {
        await listParentCategories({ id: invalidId });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  {
    const errorCode = "NOT_FOUND";

    it(`throws ewc "${errorCode}" if the category with the given id doesn't exist`, async () => {
      expect.assertions(1);

      try {
        // currently the db is empty so no category should
        // exist with the given id
        await listParentCategories({ id: "100" });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }
});

describe("Functionality", () => {
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

  it(`returns an empty array if category has no parent. i.e. parentId = null`, async () => {
    const category = Category.make({ name: "study" });
    expect(category.parentId).toBeNull();

    // inserting manually
    await db.insert(category);

    const parents = await listParentCategories({ id: category.id });
    expect(parents).toEqual([]);
  });

  it(`returns all the parents recursively`, async () => {
    await db.insertMany([...PARENT_CATEGORIES, CHILD_CATEGORY]);

    const parents = await listParentCategories({ id: CHILD_CATEGORY.id });

    expect(parents).toHaveLength(3);

    expect(parents.sort(categoryIdSortPredicate)).toEqual(PARENT_CATEGORIES);
  });
});
