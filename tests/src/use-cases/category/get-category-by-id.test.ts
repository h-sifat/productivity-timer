import { isValid as isValidId } from "common/util/id";
import makeGetCategoryById from "use-cases/category/get-category-by-id";

const db = Object.freeze({
  findById: jest.fn(),
});
const dbMethodsCount = Object.keys(db).length;

const getCategoryById = makeGetCategoryById({ db, isValidId });

beforeEach(async () => {
  Object.values(db).forEach((method) => method.mockReset());
});

describe("Validation", () => {
  {
    const errorCode = "INVALID_ARGUMENT_TYPE";
    it(`throws ewc "${errorCode}" if the argument is not a plain object`, async () => {
      expect.assertions(1 + dbMethodsCount);

      try {
        // @ts-expect-error
        await getCategoryById([]);
      } catch (ex) {
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
        await getCategoryById({ id: invalidId });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }

      for (const method of Object.values(db))
        expect(method).not.toHaveBeenCalled();
    });
  }
});

describe("Functionality", () => {
  it(`returns whatever the db.findById returns`, async () => {
    const id = "100";
    const category = Object.freeze({ name: "study" });

    db.findById.mockResolvedValueOnce(category);

    const result = await getCategoryById({ id });

    expect(result).toEqual(category);

    expect(db.findById).toHaveBeenCalledTimes(1);
    expect(db.findById).toHaveBeenCalledWith({ id });
  });
});
