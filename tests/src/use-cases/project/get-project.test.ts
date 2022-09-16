import Project from "entities/project";
import { isValid as isValidId } from "common/util/id";
import makeGetProject from "use-cases/project/get-project";
import ProjectDatabase from "fixtures/use-case/project-db";

const db = new ProjectDatabase();

const getProject = makeGetProject({ db, isValidId });

beforeEach(async () => {
  await db.clearDb();
});

describe("Validation", () => {
  {
    const errorCode = "INVALID_ID";

    it(`it throws ewc "${errorCode}" if id is not valid`, async () => {
      expect.assertions(2);

      const invalidId = "non_numeric_string";
      expect(isValidId(invalidId)).toBeFalsy();

      try {
        await getProject({ id: invalidId });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }
});

describe("Functionality", () => {
  it(`returns null if project doesn't exist`, async () => {
    // db is empty
    expect(await getProject({ id: "100" })).toBeNull();
  });
  it(`returns the project if it exists`, async () => {
    const inserted = Project.make({ name: "Todo" });

    // inserting manually
    await db.insert(inserted);

    const queriedProjectInfo = await getProject({ id: inserted.id });
    expect(queriedProjectInfo).toEqual(inserted);
  });
});
