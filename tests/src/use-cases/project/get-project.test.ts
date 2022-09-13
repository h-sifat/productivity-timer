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
  {
    const errorCode = "NOT_FOUND";

    it(`throws ewc "${errorCode}" if no project is found with the given id`, async () => {
      expect.assertions(1);

      const id = "100";

      try {
        await getProject({ id });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  {
    const errorCode = "CORRUPTED";
    it(`throws ewc "${errorCode}" if the project returned by is corrupted`, async () => {
      expect.assertions(1);

      const id = "100";
      await db.corruptById({ id, unValidatedDocument: {} });

      try {
        await getProject({ id });
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  it(`returns the project if it exists an not corrupted`, async () => {
    const insertedProjectInfo = new Project({ name: "Todo" }).toPlainObject();

    await db.insert(insertedProjectInfo);

    const queriedProjectInfo = await getProject({ id: insertedProjectInfo.id });
    expect(queriedProjectInfo).toEqual(insertedProjectInfo);
  });
});
