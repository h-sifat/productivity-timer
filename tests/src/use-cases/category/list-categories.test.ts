import Category from "entities/category";
import CategoryDatabase from "fixtures/use-case/category-db";
import makeListAllCategories from "use-cases/category/list-categories";
import makeCategoryIfNotCorrupted from "use-cases/category/util";

const db = new CategoryDatabase();

const listAllCategories = makeListAllCategories({
  db,
  makeCategoryIfNotCorrupted: makeCategoryIfNotCorrupted,
});

beforeEach(async () => {
  await db.clearDb();
});

describe("Functionality", () => {
  it(`returns empty array if no category exists in db`, async () => {
    const result = await listAllCategories();

    expect(result).toEqual({
      categories: [],
      corruptionError: [],
    });
  });

  it(`lists all the categories`, async () => {
    const categoryRecord = new Category({ name: "study" }).toPlainObject();

    await db.insert(categoryRecord);

    const { categories, corruptionError } = await listAllCategories();

    expect(corruptionError).toHaveLength(0);
    expect(categories).toHaveLength(1);

    expect(categories.pop()).toEqual(categoryRecord);
  });
});
