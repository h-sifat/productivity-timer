import Project from "entities/project";
import makeAddProject from "use-cases/project/add-project";

const insert = jest.fn();
const findByName = jest.fn();

const addProject = makeAddProject({
  db: { insert, findByName },
});

beforeEach(() => {
  insert.mockClear();
  findByName.mockClear();
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
    const errorCode = "PROJECT_CORRUPTED_IN_DB";
    it(`throws ewc "${errorCode}" if project with id already exists but is corrupted`, async () => {
      expect.assertions(1);

      // will return empty object
      findByName.mockResolvedValueOnce({});

      try {
        await addProject({ projectInfo: { name: "TodoApp" } });
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }
    });
  }

  it(`returns the existing project if the project name is the same (case insensitive)`, async () => {
    const projectName = "Todo App";
    const existingProjectRecord = new Project({
      name: projectName,
    }).toPlainObject();

    findByName.mockResolvedValueOnce(existingProjectRecord);

    const uppercaseName = projectName.toUpperCase();
    const insertedProject = await addProject({
      projectInfo: { name: uppercaseName },
    });

    expect(insertedProject).toEqual(existingProjectRecord);
    expect(findByName).toHaveBeenLastCalledWith({ name: uppercaseName });
  });

  it(`inserts a new project if it doesn't already exist`, async () => {
    const insertingProjectRecord = new Project({
      name: "todo",
    }).toPlainObject();

    insert.mockResolvedValueOnce(insertingProjectRecord);

    const inserted = await addProject({ projectInfo: insertingProjectRecord });

    expect(inserted).toEqual(insertingProjectRecord);
    expect(insert).toHaveBeenLastCalledWith({
      projectInfo: insertingProjectRecord,
    });
  });
});
