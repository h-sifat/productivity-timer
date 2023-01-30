import getID from "src/data-access/id";
import Category from "entities/category";
import makeEditCategory from "use-cases/category/edit-category";
import { deepFreeze } from "common/util/other";

const db = Object.freeze({
  findById: jest.fn(),
  updateById: jest.fn(),
});
const dbMethodsCount = Object.keys(db).length;
const sideEffect = jest.fn();

const Id = getID({ entity: "category" });

const editCategory = makeEditCategory({
  db,
  sideEffect,
  isValidId: Id.isValid,
});

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
        await editCategory(null);
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
        await editCategory({ changes: {} });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }

      for (const method of Object.values(db))
        expect(method).not.toHaveBeenCalled();
    });
  }

  {
    const errorCode = "MISSING_CHANGES";

    it(`throws ewc "${errorCode}" if the "changes" object is missing`, async () => {
      expect.assertions(1 + dbMethodsCount);

      try {
        // @ts-ignore
        await editCategory({ id: "123" });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }

      for (const method of Object.values(db))
        expect(method).not.toHaveBeenCalled();
    });
  }

  {
    const errorCode = "INVALID_CHANGES";

    it(`throws ewc "${errorCode}" if the property "changes" is not a plain object`, async () => {
      expect.assertions(1 + dbMethodsCount);

      try {
        // @ts-expect-error changes is not a plain object
        await editCategory({ id: "123", changes: [] });
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
      expect(Id.isValid(invalidId)).toBeFalsy();

      try {
        await editCategory({ id: invalidId, changes: {} });
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
      expect.assertions(3);

      // meaning no category exists with the given id
      db.findById.mockResolvedValueOnce(null);

      try {
        // currently the db is empty so no category should
        // exist with the given id
        await editCategory({ id: Id.makeId(), changes: {} });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }

      expect(db.findById).toHaveBeenCalledTimes(1);
      expect(db.updateById).not.toHaveBeenCalled();
    });
  }

  {
    const errorCode = "INVALID_PARENT_ID";

    it(`throws ewc "${errorCode}" if the changes.parentId is not valid`, async () => {
      expect.assertions(3);

      const category = Category.make({ name: "a" });

      // meaning a category exists with the given id
      db.findById.mockResolvedValueOnce(category);

      try {
        await editCategory({
          id: category.id,
          // @ts-expect-error invalid parentId
          changes: { parentId: ["duck"] },
        });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }

      expect(db.findById).toHaveBeenCalledTimes(1);
      expect(db.updateById).not.toHaveBeenCalled();
    });
  }

  {
    const errorCode = "PARENT_NOT_FOUND";

    it(`throws ewc "${errorCode}" if the category with the given id doesn't exist`, async () => {
      expect.assertions(5);

      const category = Category.make({ name: "a" });
      const id = category.id;
      const parentId = id + "1";

      // manually inserting a category in the db
      db.findById.mockResolvedValueOnce(category);
      // the second call should be to find the parent
      db.findById.mockResolvedValueOnce(null);

      expect(category.parentId).toBeNull();

      try {
        // as the db.findById will return null in the second call, it should
        // throw an error
        await editCategory({ id, changes: { parentId } });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }

      expect(db.updateById).not.toHaveBeenCalled();
      expect(db.findById).toHaveBeenCalledTimes(2);
      expect(db.findById.mock.calls).toEqual([[{ id }], [{ id: parentId }]]);
    });
  }
});

describe("Functionality", () => {
  it("edits a category if everything is valid", async () => {
    const category = deepFreeze({
      ...Category.make({ name: "a" }),
      // createdAt: 100,
    });

    expect(category.description).toBeNull();

    const id = category.id;

    // as if we're inserting the category in db
    db.findById.mockResolvedValueOnce(category);

    const editedDescription = "description";
    const editedName = category.name + "_";

    const editedCategory = await editCategory({
      id,
      changes: { description: editedDescription, name: editedName },
    });

    expect(editedCategory).toMatchObject({
      id,
      name: editedName,
      description: editedDescription,
      parentId: category.parentId,
      createdAt: category.createdAt,
    });

    expect(category.hash).not.toBe(editedCategory.hash);

    // as the changes doesn't edit the parentId, so it should not to lookup
    // the parent  category thus calling the db.findById only once
    expect(db.findById).toHaveBeenCalledTimes(1);
    expect(db.findById).toHaveBeenCalledWith({ id: category.id });

    expect(db.updateById).toHaveBeenCalledTimes(1);
    expect(db.updateById).toHaveBeenCalledWith({
      id: category.id,
      edited: editedCategory,
    });

    expect(sideEffect).toHaveBeenCalledTimes(1);
    expect(sideEffect).toHaveBeenCalledWith({
      original: category,
      updated: editedCategory,
    });
  });
});
