import Category from "entities/category";
import { isValid as isValidId } from "common/util/id";
import makeRemoveCategory from "use-cases/category/remove-category";

const db = Object.freeze({
  deleteById: jest.fn(),
});
const sideEffect = jest.fn();

const removeCategory = makeRemoveCategory({ db, isValidId, sideEffect });

beforeEach(() => {
  sideEffect.mockReset();
  Object.values(db).forEach((method) => method.mockReset());
});

describe("Validation", () => {
  {
    const errorCode = "INVALID_ARGUMENT_TYPE";
    it(`throws ewc "${errorCode}" if the argument is not a plain object`, async () => {
      expect.assertions(3);

      try {
        // @ts-expect-error
        await removeCategory(["NOT_PLAIN_OBJECT"]);
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }

      expect(sideEffect).not.toHaveBeenCalled();
      expect(db.deleteById).not.toHaveBeenCalled();
    });
  }

  {
    const errorCode = "MISSING_ID";

    it(`throws ewc "${errorCode}" if id is missing`, async () => {
      expect.assertions(3);

      try {
        // @ts-ignore
        await removeCategory({});
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }

      expect(sideEffect).not.toHaveBeenCalled();
      expect(db.deleteById).not.toHaveBeenCalled();
    });
  }

  {
    const errorCode = "INVALID_ID";

    it(`throws ewc "${errorCode}" if the given id is invalid`, async () => {
      expect.assertions(4);

      const invalidId = "non_numeric_string";
      expect(isValidId(invalidId)).toBeFalsy();

      try {
        await removeCategory({ id: invalidId });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }

      expect(sideEffect).not.toHaveBeenCalled();
      expect(db.deleteById).not.toHaveBeenCalled();
    });
  }
});

describe("Functionality", () => {
  it(`delete the category`, async () => {
    const study = Category.make({ name: "study" });
    const programming = Category.make({
      name: "programming",
      parentId: study.id,
    });

    const fakeDeleteByIdResult = Object.freeze([study, programming]);
    db.deleteById.mockResolvedValueOnce(fakeDeleteByIdResult);

    const deletedCategories = await removeCategory({ id: study.id });

    expect(deletedCategories).toEqual(fakeDeleteByIdResult);

    expect(db.deleteById).toHaveBeenCalledTimes(1);
    expect(sideEffect).toHaveBeenCalledTimes(1);

    expect(db.deleteById).toHaveBeenCalledWith({ id: study.id });
    expect(sideEffect).toHaveBeenCalledWith({
      id: study.id,
      deleted: fakeDeleteByIdResult,
    });
  });
});
