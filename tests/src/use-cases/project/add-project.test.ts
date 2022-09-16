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
  it(`returns the existing project if the project name is the same (case insensitive)`, async () => {
    const projectName = "Todo App";
    const existingProject = Project.make({ name: projectName });

    // inserting project manually
    await db.insert(existingProject);

    const uppercaseName = projectName.toUpperCase();
    const insertedProject = await addProject({
      projectInfo: { name: uppercaseName },
    });

    expect(insertedProject).toEqual(existingProject);
  });

  it(`inserts a new project if it doesn't already exist`, async () => {
    const projectInfo = {
      name: "todo",
      description: "hi",
    };

    const inserted = await addProject({ projectInfo });

    expect(inserted).toMatchObject(projectInfo);
    expect(await db.findById({ id: inserted.id })).toEqual(inserted);
  });
});
