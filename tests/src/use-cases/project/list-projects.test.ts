import Project from "entities/project";
import makeListProjects from "use-cases/project/list-projects";

const findAll = jest.fn();
const db = Object.freeze({ findAll });

const listProjects = makeListProjects({ db });

beforeEach(() => {
  Object.values(db).forEach((method) => method.mockClear());
});

describe("Functionality", () => {
  it(`returns empty array if db is empty`, async () => {
    findAll.mockResolvedValueOnce([]);

    const result = await listProjects();

    expect(findAll).toHaveBeenCalled();

    expect(result).toEqual({
      projects: [],
      corrupted: [],
    });
  });

  it(`returns any corrupted projects data in the corrupted array`, async () => {
    const projectInfo = new Project({ name: "todo" }).toPlainObject();
    const corruptedProjectInfo = { ...projectInfo, name: ["not-a-string"] };

    findAll.mockResolvedValueOnce([corruptedProjectInfo]);

    const { projects, corrupted } = await listProjects();

    expect(findAll).toHaveBeenCalled();

    expect(projects).toHaveLength(0);
    expect(corrupted).toHaveLength(1);

    expect(corrupted[0]).toEqual({
      record: corruptedProjectInfo,
      error: expect.any(Error),
    });
  });

  it(`returns all the projects records`, async () => {
    const projectInfo = new Project({ name: "todo" }).toPlainObject();

    findAll.mockResolvedValueOnce([projectInfo]);

    const { projects, corrupted } = await listProjects();

    expect(findAll).toHaveBeenCalled();

    expect(projects).toHaveLength(1);
    expect(corrupted).toHaveLength(0);

    expect(projects[0]).toEqual(projectInfo);
  });
});
