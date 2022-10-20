import Category from "entities/category";
import makeListCategories from "use-cases/category/list-categories";

const db = Object.freeze({
  findAll: jest.fn(),
});

const listCategories = makeListCategories({ db });

beforeEach(() => {
  Object.values(db).forEach((method) => method.mockReset());
});

describe("Functionality", () => {
  it(`returns empty array if no category exists in db`, async () => {
    db.findAll.mockResolvedValueOnce([]);

    const result = await listCategories();

    expect(result).toEqual([]);

    expect(db.findAll).toHaveBeenCalledTimes(1);
  });

  it(`lists all the categories`, async () => {
    const category = Category.make({ name: "study" });

    db.findAll.mockResolvedValueOnce([category]);

    const categories = await listCategories();

    expect(categories).toHaveLength(1);
    expect(categories.pop()).toEqual(category);

    expect(db.findAll).toHaveBeenCalledTimes(1);
  });
});
