import Category from "entities/category";
import CategoryDatabase from "fixtures/use-case/category-db";
import makeListCategories from "use-cases/category/list-categories";
import makeCategoryIfNotCorrupted from "use-cases/category/util";

const db = new CategoryDatabase();

const listCategories = makeListCategories({
  db,
  makeCategoryIfNotCorrupted: makeCategoryIfNotCorrupted,
});

beforeEach(async () => {
  await db.clearDb();
});

describe("Functionality", () => {
  it(`returns empty array if no category exists in db`, async () => {
    const result = await listCategories();

    expect(result).toEqual({
      categories: [],
      corrupted: [],
    });
  });

  it(`lists all the categories`, async () => {
    const categoryRecord = new Category({ name: "study" }).toPlainObject();

    await db.insert(categoryRecord);

    const { categories, corrupted: corruptionError } = await listCategories();

    expect(corruptionError).toHaveLength(0);
    expect(categories).toHaveLength(1);

    expect(categories.pop()).toEqual(categoryRecord);
  });

  it(`returns corrupted categories in the corrupted array`, async () => {
    const corruptedDocument = {
      name: "work",
      description:
        "Oh Hi, ur nasty user violated me and removed my Id from the sqlite db. Lol",
    };
    await db.corruptById({
      id: "100",
      unValidatedDocument: corruptedDocument,
    });

    const { categories, corrupted } = await listCategories();
    expect(categories).toHaveLength(0);
    expect(corrupted).toHaveLength(1);

    expect(corrupted[0]).toEqual({
      record: corruptedDocument,
      error: expect.any(Error),
    });
  });
});
