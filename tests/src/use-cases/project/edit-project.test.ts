import Project from "entities/project";
import { isValid as isValidId } from "common/util/id";
import ProjectDatabase from "fixtures/use-case/project-db";
import makeEditProject from "use-cases/project/edit-project";

const db = new ProjectDatabase();

beforeEach(async () => {
  await db.clearDb();
});

const editProject = makeEditProject({ db, isValidId });

describe("Validation", () => {
  {
    const errorCode = "INVALID_ID";

    it(`it throws ewc "${errorCode}" if id is not valid`, async () => {
      expect.assertions(2);

      const invalidId = "non_numeric_string";
      expect(isValidId(invalidId)).toBeFalsy();

      try {
        await editProject({ id: invalidId, changes: {} });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  {
    const errorCode = "NOT_FOUND";

    it(`throws ewc "${errorCode}" if the project with the given id doesn't exist`, async () => {
      expect.assertions(1);

      // right now db is empty so no project exists with the id: "100"
      const id = "100";

      try {
        await editProject({ id, changes: {} });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }
});

describe("Functionality", () => {
  it(`edits a project if everything is valid`, async () => {
    const project = Project.make({ name: "Todo" });

    await db.insert(project);

    const edits = {
      status: "completed",
      categoryId: project.id + "12",
    } as const;

    const editedProject = await editProject({ id: project.id, changes: edits });

    expect(editedProject).toMatchObject({ ...project, ...edits });
  });
});
