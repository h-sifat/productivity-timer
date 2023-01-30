import Category from "entities/category";
import makeAddCategory from "use-cases/category/add-category";

const db = Object.freeze({
  insert: jest.fn(),
  findById: jest.fn(),
  findByHash: jest.fn(),
});
const dbMethodsCount = Object.keys(db).length;
const sideEffect = jest.fn();

const addCategory = makeAddCategory({ db, sideEffect });

beforeEach(async () => {
  Object.values(db).forEach((method) => method.mockReset());
  sideEffect.mockReset();
});

describe("Validation", () => {
  {
    const errorCode = "INVALID_ARGUMENT_TYPE";
    it(`throws ewc "${errorCode}" if the argument is not a plain object`, async () => {
      expect.assertions(1 + dbMethodsCount);

      try {
        // @ts-expect-error
        await addCategory(null);
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }

      for (const method of Object.values(db))
        expect(method).not.toHaveBeenCalled();
    });
  }

  {
    const errorCode = "MISSING_CATEGORY_INFO";

    it(`throws ewc "${errorCode}" is the "categoryInfo" property is missing`, async () => {
      expect.assertions(1 + dbMethodsCount);

      try {
        // @ts-expect-error
        await addCategory({});
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }

      for (const method of Object.values(db))
        expect(method).not.toHaveBeenCalled();
    });
  }
});

describe("Insertion", () => {
  it("inserts a category object", async () => {
    const name = "name";
    const description = "desc";
    const inserted = await addCategory({ categoryInfo: { name, description } });

    expect(inserted).toMatchObject({
      name,
      description,
      parentId: null,
      id: expect.any(String),
      hash: expect.any(String),
      createdAt: expect.any(Number),
    });

    expect(db.findById).not.toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(db.findByHash).toHaveBeenCalledTimes(1);

    expect(db.insert).toHaveBeenCalledWith(inserted);
    expect(db.findByHash).toHaveBeenCalledWith({ hash: inserted.hash });

    expect(sideEffect).toHaveBeenCalledTimes(1);
    expect(sideEffect).toHaveBeenCalledWith(inserted);
  });

  it("throws error if category info is invalid", async () => {
    expect.assertions(4);

    try {
      // @ts-expect-error name field is missing
      await addCategory({ categoryInfo: {} });
    } catch (ex: any) {
      expect(ex.code).toBe("MISSING_NAME");
    }

    for (const method of Object.values(db))
      expect(method).not.toHaveBeenCalled();
  });

  {
    const errorCode = "CATEGORY_EXISTS";

    it(`throws ewc "${errorCode}" if another category with the same name and parentId already exists`, async () => {
      expect.assertions(3);

      const name = "study";
      const category = Category.make({ name });

      // if findByHash returns a category then it means another category
      // with the same name parentId already exists
      db.findByHash.mockResolvedValueOnce(category);

      try {
        await addCategory({ categoryInfo: { name } });
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }

      expect(db.insert).not.toHaveBeenCalled();
      expect(db.findById).not.toHaveBeenCalled();
    });
  }

  {
    const errorCode = "PARENT_NOT_FOUND";

    it(`throws ewc "${errorCode}" if a category has a non null parentId and that parent doesn't exist`, async () => {
      expect.assertions(6);

      const categoryInfo = Object.freeze({ name: "a", parentId: "100" });

      // meaning no category with the same name and parent exists
      db.findByHash.mockReturnValueOnce(null);

      // db.findById is called to make sure the parent exists
      // receiving null means the parent doesn't exist
      db.findById.mockResolvedValueOnce(null);

      try {
        await addCategory({ categoryInfo });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }

      expect(db.insert).not.toHaveBeenCalled();

      expect(db.findByHash).toHaveBeenCalledTimes(1);
      expect(db.findById).toHaveBeenCalledTimes(1);

      expect(db.findByHash).toHaveBeenCalledWith({ hash: expect.any(String) });
      expect(db.findById).toHaveBeenCalledWith({ id: categoryInfo.parentId });
    });
  }
});
