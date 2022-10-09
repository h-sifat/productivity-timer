import Project from "entities/project";
import makeAddProject from "use-cases/project/add-project";

const db = Object.freeze({
  findByName: jest.fn(),
  insert: jest.fn(),
});

const addProject = makeAddProject({ db });

beforeEach(() => {
  db.findByName.mockReset();
  db.insert.mockReset();
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
    const errorCode = "DUPLICATE_NAME";

    it(`throws ewc "${errorCode}" if a project already with the same name (case insensitive)`, async () => {
      expect.assertions(4);

      const projectName = "Todo App";
      const existingProject = Project.make({ name: projectName });

      db.findByName.mockResolvedValueOnce(existingProject);

      const uppercaseName = projectName.toUpperCase();

      try {
        await addProject({ projectInfo: { name: uppercaseName } });
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }

      expect(db.findByName).toHaveBeenCalledTimes(1);
      expect(db.insert).not.toHaveBeenCalled();

      expect(db.findByName).toHaveBeenCalledWith({ name: uppercaseName });
    });
  }

  it(`inserts a new project if it doesn't already exist`, async () => {
    const projectInfo = Object.freeze({
      name: "todo",
      description: "hi",
    });

    db.findByName.mockResolvedValueOnce(null);

    await addProject({ projectInfo });

    expect(db.findByName).toHaveBeenCalledTimes(1);
    expect(db.insert).toHaveBeenCalledTimes(1);

    expect(db.findByName).toHaveBeenCalledWith({ name: projectInfo.name });

    // @ts-ignore I don't know why it says lastCall doesn't exists!
    expect(db.insert.mock.lastCall[0]).toMatchObject(projectInfo);
  });
});
