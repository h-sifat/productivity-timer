import Project from "entities/project";
import ProjectDatabase from "fixtures/use-case/project-db";
import makeAddProject from "use-cases/project/add-project";

const db = new ProjectDatabase();
const addProject = makeAddProject({ db });

beforeEach(async () => {
  await db.clearDb();
});

describe("Validation", () => {
  it(`throws error if any project field is not valid`, async () => {
    expect.assertions(2);

    try {
      // @ts-ignore
      await addProject({ projectInfo: { name: ["not_a_non_empty_string"] } });
    } catch (ex: any) {
      expect(ex).toEqual(expect.any(Error));
      expect(ex).toMatchObject({
        code: expect.any(String),
        message: expect.any(String),
      });
    }
  });
});

describe("Functionality", () => {
  {
    const errorCode = "CORRUPTED";
    it(`throws ewc "${errorCode}" if project already exists but is corrupted`, async () => {
      expect.assertions(3);

      const name = "TodoApp";
      const corruptedRecord = { id: "1", name, createdOn: "not_a_time_stamp" };

      db.corruptById({
        id: corruptedRecord.id,
        unValidatedDocument: corruptedRecord,
      });

      try {
        await addProject({ projectInfo: { name: name.toLowerCase() } });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
        expect(ex.record).toEqual(corruptedRecord);
        expect(ex.originalError).toMatchObject({
          code: expect.any(String),
          message: expect.any(String),
        });
      }
    });
  }

  it(`returns the existing project if the project name is the same (case insensitive)`, async () => {
    const projectName = "Todo App";
    const existingProject = new Project({
      name: projectName,
    }).toPlainObject();

    await db.insert(existingProject);

    const uppercaseName = projectName.toUpperCase();
    const insertedProject = await addProject({
      projectInfo: { name: uppercaseName },
    });

    expect(insertedProject).toEqual(existingProject);
  });

  it(`inserts a new project if it doesn't already exist`, async () => {
    const insertingProjectRecord = new Project({
      name: "todo",
    }).toPlainObject();

    const inserted = await addProject({ projectInfo: insertingProjectRecord });

    expect(inserted).toEqual(insertingProjectRecord);
  });
});
