import getID from "src/data-access/id";
import Category from "entities/category";
import { CategoryFields } from "entities/category/category";
import CategoryDatabase from "fixtures/use-case/category-db";
import makeListSubCategories from "use-cases/category/list-sub-categories";

const db = new CategoryDatabase();
const Id = getID({ entity: "category" });

const listSubCategories = makeListSubCategories({ Id, db });

beforeEach(async () => {
  await db.clearDb();
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
        await listSubCategories({ parentId: invalidParentId });
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

  const PARENT_CATEGORY = Category.make({ name: "study" });

  const SUB_CATEGORIES = (() => {
    const programming = Category.make({
      name: "programming",
      parentId: PARENT_CATEGORY.id,
    });

    const academic = Category.make({
      name: "academic",
      parentId: PARENT_CATEGORY.id,
    });

    const levelTwoSubCategories = [
      { name: "DSA", parentId: programming.id },
      { name: "Backend", parentId: programming.id },

      { name: "math", parentId: academic.id },
      { name: "english", parentId: academic.id },
    ].map((arg) => Category.make(arg));

    return [programming, academic, ...levelTwoSubCategories];
  })();
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

  it(`returns an empty array for the children field if no child is found for the given parentId`, async () => {
    await db.insert(PARENT_CATEGORY);
    // right now no direct sub category should exist in db

    const children = await listSubCategories({ parentId: PARENT_CATEGORY.id });

    expect(children).toEqual([]);
  });

  it(`returns only the direct sub categories for the given parentId if "recursive" flag is false`, async () => {
    // populate the db manually
    await db.insertMany([PARENT_CATEGORY, ...SUB_CATEGORIES]);

    const subCategories = await listSubCategories({
      parentId: PARENT_CATEGORY.id,
    });

    const expectedSubCategories = SUB_CATEGORIES.filter(
      (cat) => cat.parentId === PARENT_CATEGORY.id
    );

    expect(subCategories).toEqual(expectedSubCategories);
  });

  it(`returns all children recursively if the "recursive" flag is true`, async () => {
    // populate the db manually
    await db.insertMany([PARENT_CATEGORY, ...SUB_CATEGORIES]);

    const subCategories = await listSubCategories({
      recursive: true,
      parentId: PARENT_CATEGORY.id,
    });

    expect(subCategories.sort(categoryIdSortPredicate)).toEqual(
      SUB_CATEGORIES.sort(categoryIdSortPredicate)
    );
  });
});
