import Category from "entities/category";
import { isValid as isValidId } from "common/util/id";
import makeRemoveCategory from "use-cases/category/remove-category";

const forbiddenDeleteById: any = () => {
  throw new Error(`"deleteById" should not have been called`);
};

describe("Validation", () => {
  {
    const removeCategory = makeRemoveCategory({
      isValidId,
      db: { deleteById: forbiddenDeleteById },
    });

    const errorCode = "INVALID_ARGUMENT_TYPE";
    it(`throws ewc "${errorCode}" if the argument is not a plain object`, async () => {
      expect.assertions(1);

      try {
        // @ts-expect-error
        await removeCategory(["NOT_PLAIN_OBJECT"]);
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  {
    const errorCode = "MISSING_ID";

    const removeCategory = makeRemoveCategory({
      isValidId,
      db: { deleteById: forbiddenDeleteById },
    });

    it(`throws ewc "${errorCode}" if id is missing`, async () => {
      expect.assertions(1);

      try {
        // @ts-ignore
        await removeCategory({});
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  {
    const removeCategory = makeRemoveCategory({
      isValidId,
      db: { deleteById: forbiddenDeleteById },
    });
    const errorCode = "INVALID_ID";

    it(`throws ewc "${errorCode}" if the given id is invalid`, async () => {
      expect.assertions(2);

      const invalidId = "non_numeric_string";
      expect(isValidId(invalidId)).toBeFalsy();

      try {
        await removeCategory({ id: invalidId });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
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

    const deleteByIdResult = [study, programming];

    const removeCategory = makeRemoveCategory({
      isValidId,
      db: {
        async deleteById({ id }) {
          if (id !== study.id) throw new Error(`Id must be equal to study.id`);
          return deleteByIdResult;
        },
      },
    });

    const deletedCategories = await removeCategory({ id: study.id });

    expect(deletedCategories).toEqual(deleteByIdResult);
  });
});
