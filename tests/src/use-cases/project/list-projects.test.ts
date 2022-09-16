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
    expect(result).toEqual([]);
  });

  it(`returns all the projects records`, async () => {
    const inserted = Project.make({ name: "todo" });

    await db.insert(inserted);

    const projects = await listProjects();

    expect(projects).toHaveLength(1);
    expect(projects[0]).toEqual(inserted);
  });
});
