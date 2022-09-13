import Project from "entities/project";
import ProjectDatabase from "fixtures/use-case/project-db";
import makeListProjects from "use-cases/project/list-projects";

const db = new ProjectDatabase();

const listProjects = makeListProjects({ db });

beforeEach(async () => {
  await db.clearDb();
});

describe("Functionality", () => {
  it(`returns empty array if db is empty`, async () => {
    const result = await listProjects();

    expect(result).toEqual({
      projects: [],
      corrupted: [],
    });
  });

  it(`returns any corrupted projects data in the corrupted array`, async () => {
    const corruptedProjectInfo = {
      ...new Project({ name: "todo" }).toPlainObject(),
      name: ["not-a-string"],
    };

    await db.corruptById({
      id: corruptedProjectInfo.id,
      unValidatedDocument: corruptedProjectInfo,
    });

    const { projects, corrupted } = await listProjects();

    expect(projects).toHaveLength(0);
    expect(corrupted).toHaveLength(1);

    expect(corrupted[0]).toEqual({
      record: corruptedProjectInfo,
      error: expect.any(Error),
    });
  });

  it(`returns all the projects records`, async () => {
    const projectInfo = new Project({ name: "todo" }).toPlainObject();

    await db.insert(projectInfo);

    const { projects, corrupted } = await listProjects();

    expect(projects).toHaveLength(1);
    expect(corrupted).toHaveLength(0);

    expect(projects[0]).toEqual(projectInfo);
  });
});
