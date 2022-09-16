import getID from "src/date-access/id";
import Category from "entities/category";
import CategoryDatabase from "fixtures/use-case/category-db";
import makeEditCategory from "use-cases/category/edit-category";

const db = new CategoryDatabase();
const Id = getID({ entity: "category" });

const editCategory = makeEditCategory({ db, isValidId: Id.isValid });

beforeEach(async () => {
  await db.clearDb();
});

describe("Validation", () => {
  {
    const errorCode = "MISSING_ID";

    it(`throws ewc "${errorCode}" if id is missing`, async () => {
      expect.assertions(1);

      try {
        // @ts-ignore
        await editCategory({ changes: {} });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  {
    const errorCode = "MISSING_CHANGES";

    it(`throws ewc "${errorCode}" if the "changes" object is missing`, async () => {
      expect.assertions(1);

      try {
        // @ts-ignore
        await editCategory({ id: "123" });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  {
    const errorCode = "INVALID_ID";

    it(`it throws ewc "${errorCode}" if id is not valid`, async () => {
      expect.assertions(2);

      const invalidId = "non_numeric_string";
      expect(Id.isValid(invalidId)).toBeFalsy();

      try {
        await editCategory({ id: invalidId, changes: {} });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  {
    const errorCode = "NOT_FOUND";

    it(`throws ewc "${errorCode}" if the category with the given id doesn't exist`, async () => {
      expect.assertions(1);

      try {
        // currently the db is empty so no category should
        // exist with the given id
        await editCategory({ id: Id.makeId(), changes: {} });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  {
    const errorCode = "PARENT_NOT_FOUND";

    it(`throws ewc "${errorCode}" if the category with the given id doesn't exist`, async () => {
      expect.assertions(2);

      const category = Category.make({ name: "a" });
      const id = category.id;

      // manually inserting a category in the db
      await db.insert(category);

      expect(category.parentId).toBeNull();

      try {
        // currently the db only has the category so a parent category
        // with the id: (category.id + "1") does not exist
        await editCategory({ id, changes: { parentId: id + "1" } });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }
});

describe("Functionality", () => {
  it("edits a category if everything is valid", async () => {
    const categoryBeforeEdit = {
      ...Category.make({ name: "a" }),
      createdOn: 100,
    };

    expect(categoryBeforeEdit.description).toBeNull();

    const id = categoryBeforeEdit.id;

    await db.insert(categoryBeforeEdit);

    const editedDescription = "description";
    const editedName = categoryBeforeEdit.name + "_";

    const categoryAfterEdit = await editCategory({
      id,
      changes: { description: editedDescription, name: editedName },
    });

    expect(categoryAfterEdit).toMatchObject({
      id,
      name: editedName,
      description: editedDescription,
      parentId: categoryBeforeEdit.parentId,
      createdOn: categoryBeforeEdit.createdOn,
    });

    expect(categoryBeforeEdit.hash).not.toBe(categoryAfterEdit.hash);
  });
});
