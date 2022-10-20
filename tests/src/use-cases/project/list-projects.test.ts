import makeListProjects from "use-cases/project/list-projects";

const db = Object.freeze({
  findAll: jest.fn(),
});

const listProjects = makeListProjects({ db });

beforeEach(() => {
  Object.values(db).forEach((method) => method.mockReset());
});

describe("Functionality", () => {
  it(`returns whatever the db.findAll returns without validation`, async () => {
    const projects = Object.freeze(["Dang TODO that's taking a long time"]);
    db.findAll.mockResolvedValueOnce(projects);

    const result = await listProjects();
    expect(result).toEqual(projects);

    expect(db.findAll).toHaveBeenCalledTimes(1);
  });
});
