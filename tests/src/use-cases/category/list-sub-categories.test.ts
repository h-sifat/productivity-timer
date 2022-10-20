import getID from "src/data-access/id";
import Category from "entities/category";
import makeListSubCategories from "use-cases/category/list-sub-categories";

const db = Object.freeze({
  findById: jest.fn(),
  findSubCategories: jest.fn(),
});

const dbMethodsCount = Object.keys(db).length;
const Id = getID({ entity: "category" });

const listSubCategories = makeListSubCategories({ Id, db });

beforeEach(() => {
  Object.values(db).forEach((method) => method.mockReset());
});

describe("Validation", () => {
  {
    const errorCode = "INVALID_PARENT_ID";

    it(`returns ewc "${errorCode} if parentId is not valid" `, async () => {
      expect.assertions(2 + dbMethodsCount);

      const invalidParentId = "0"; // not a positive integer
      expect(Id.isValid(invalidParentId)).toBeFalsy();

      try {
        // @ts-ignore
        await listSubCategories({ parentId: invalidParentId });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }

      for (const method of Object.values(db))
        expect(method).not.toHaveBeenCalled();
    });
  }

  {
    const errorCode = "PARENT_NOT_FOUND";

    it(`throws ewc "${errorCode}" if the parent category does not exist`, async () => {
      expect.assertions(4);

      const parentId = "23423";

      // meaning the parent category with the given id doesn't exist
      db.findById.mockResolvedValueOnce(null);

      try {
        await listSubCategories({ parentId });
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }

      expect(db.findById).toHaveBeenCalledTimes(1);
      expect(db.findById).toHaveBeenCalledWith({ id: parentId });
      expect(db.findSubCategories).not.toHaveBeenCalled();
    });
  }
});

describe("Functionality", () => {
  it(`returns whatever the db.findSubCategories returns`, async () => {
    const category = Category.make({ name: "Alex" });

    const parentId = category.id;

    db.findById.mockResolvedValueOnce(category);

    const subCategories = Object.freeze(["Blex", "Clex"]);
    db.findSubCategories.mockResolvedValueOnce(subCategories);

    const result = await listSubCategories({ parentId });

    expect(result).toEqual(subCategories);

    expect(db.findById).toHaveBeenCalledTimes(1);
    expect(db.findSubCategories).toHaveBeenCalledTimes(1);

    expect(db.findById).toHaveBeenCalledWith({ id: parentId });
    expect(db.findSubCategories).toHaveBeenCalledWith({ parentId });
  });
});
