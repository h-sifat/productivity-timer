import Category from "entities/category";
import CategoryDatabase from "fixtures/use-case/category-db";
import makeListCategories from "use-cases/category/list-categories";

const db = new CategoryDatabase();

const listCategories = makeListCategories({ db });

beforeEach(async () => {
  await db.clearDb();
});

describe("Functionality", () => {
  it(`returns empty array if no category exists in db`, async () => {
    const result = await listCategories();

    expect(result).toEqual([]);
  });

  it(`lists all the categories`, async () => {
    const categoryRecord = Category.make({ name: "study" });

    await db.insert(categoryRecord);

    const categories = await listCategories();

    expect(categories).toHaveLength(1);
    expect(categories.pop()).toEqual(categoryRecord);
  });
});
