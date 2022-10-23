import Category from "entities/category";
import { isValid as isValidId } from "common/util/id";
import makeListParentCategories from "use-cases/category/list-parent-categories";

const db = Object.freeze({
  findById: jest.fn(),
  findParentCategories: jest.fn(),
});
const dbMethodsCount = Object.keys(db).length;

const listParentCategories = makeListParentCategories({ db, isValidId });

beforeEach(() => {
  Object.values(db).forEach((method) => method.mockReset());
});

describe("Validation", () => {
  {
    const errorCode = "INVALID_ARGUMENT_TYPE";
    it(`throws ewc "${errorCode}" if the argument is not a plain object`, async () => {
      expect.assertions(1 + dbMethodsCount);

      try {
        // @ts-expect-error arg not plain object
        await listParentCategories([]);
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }

      for (const method of Object.values(db))
        expect(method).not.toHaveBeenCalled();
    });
  }

  {
    const errorCode = "MISSING_ID";

    it(`throws ewc "${errorCode}" if id is missing`, async () => {
      expect.assertions(1 + dbMethodsCount);

      try {
        // @ts-ignore
        await listParentCategories({});
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }

      for (const method of Object.values(db))
        expect(method).not.toHaveBeenCalled();
    });
  }

  {
    const errorCode = "INVALID_ID";

    it(`it throws ewc "${errorCode}" if id is not valid`, async () => {
      expect.assertions(2 + dbMethodsCount);

      const invalidId = "non_numeric_string";
      expect(isValidId(invalidId)).toBeFalsy();

      try {
        await listParentCategories({ id: invalidId });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }

      for (const method of Object.values(db))
        expect(method).not.toHaveBeenCalled();
    });
  }

  {
    const errorCode = "NOT_FOUND";

    it(`throws ewc "${errorCode}" if the category with the given id doesn't exist`, async () => {
      expect.assertions(4);

      const id = "100";

      // meaning on category was found with the given id
      db.findById.mockReturnValueOnce(null);

      try {
        // currently the db is empty so no category should
        // exist with the given id
        await listParentCategories({ id });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }

      expect(db.findParentCategories).not.toHaveBeenCalled();
      expect(db.findById).toHaveBeenCalledTimes(1);
      expect(db.findById).toHaveBeenCalledWith({ id });
    });
  }
});

describe("Functionality", () => {
  it(`returns an empty array if category has no parent. i.e. parentId = null`, async () => {
    const category = Category.make({ name: "study" });
    expect(category.parentId).toBeNull();

    // inserting category manually
    db.findById.mockReturnValueOnce(category);
    // return an empty array
    db.findParentCategories.mockResolvedValueOnce([]);

    const parents = await listParentCategories({ id: category.id });
    expect(parents).toEqual([]);

    expect(db.findById).toHaveBeenCalledTimes(1);

    // because the parentId is null
    expect(db.findParentCategories).not.toHaveBeenCalled();

    expect(db.findById).toHaveBeenCalledWith({ id: category.id });
  });

  it(`returns whatever the db.findParentCategories returns without validation`, async () => {
    const category = Category.make({ name: "study", parentId: "23423423" });
    expect(category.parentId).not.toBeNull();

    // inserting category manually
    db.findById.mockReturnValueOnce(category);

    const parentCategories = Object.freeze(["Mom", "Dad", "Grandfather"]);
    // return an empty array
    db.findParentCategories.mockResolvedValueOnce(parentCategories);

    const parents = await listParentCategories({ id: category.id });
    expect(parents).toEqual(parentCategories);

    expect(db.findById).toHaveBeenCalledTimes(1);
    expect(db.findParentCategories).toHaveBeenCalledTimes(1);

    expect(db.findById).toHaveBeenCalledWith({ id: category.id });
    expect(db.findParentCategories).toHaveBeenCalledWith({ id: category.id });
  });
});
