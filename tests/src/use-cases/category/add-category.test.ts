import CategoryDatabase from "fixtures/use-case/category-db";
import makeAddCategory from "use-cases/category/add-category";

const db = new CategoryDatabase();
const addCategory = makeAddCategory({ db });

beforeEach(async () => {
  await db.clearDb();
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
      createdOn: expect.any(Number),
    });
  });

  it("throws error if category info is invalid", async () => {
    expect.assertions(1);

    try {
      // @ts-expect-error name field is missing
      await addCategory({ categoryInfo: {} });
    } catch (ex: any) {
      expect(ex.code).toBe("MISSING_NAME");
    }
  });

  it(`doesn't insert the same category twice if name and parentId is the same`, async () => {
    const name = "study";
    const descriptionBefore = "Before";
    const descriptionAfter = "After";

    const insertedBefore = await addCategory({
      categoryInfo: { name, description: descriptionBefore },
    });
    const insertedAfter = await addCategory({
      // adding some whitespace in name
      categoryInfo: { name: `    ${name}  `, description: descriptionAfter },
    });

    expect(insertedBefore).toEqual(insertedAfter);
  });

  {
    const errorCode = "PARENT_NOT_FOUND";

    it(`throws ewc "${errorCode}" if a category has a non null parentId and that parent doesn't exist`, async () => {
      expect.assertions(1);

      try {
        await addCategory({ categoryInfo: { name: "a", parentId: "100" } });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }
});
