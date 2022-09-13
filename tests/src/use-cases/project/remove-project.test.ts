import Project from "entities/project";
import { isValid as isValidId } from "common/util/id";
import makeRemoveProject from "use-cases/project/remove-project";

import ProjectDatabase from "fixtures/use-case/project-db";
const db = new ProjectDatabase();

const removeProject = makeRemoveProject({ db, isValidId });

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
        await removeProject({ id: invalidId });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }
});

describe("Functionality", () => {
  it(`return delete and the project record`, async () => {
    const projectInfo = new Project({ name: "todo" }).toPlainObject();
    const id = projectInfo.id;

    await db.insert(projectInfo);

    const deleted = await removeProject({ id });

    expect(deleted).toEqual(projectInfo);
  });

  {
    const errorCode = "NOT_FOUND";
    it(`throws ewc "${errorCode}" if project doesn't exist with the given id`, async () => {
      expect.assertions(1);

      // right now db is empty
      const id = "100";

      try {
        await removeProject({ id });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }
});
