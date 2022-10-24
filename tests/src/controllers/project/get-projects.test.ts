import EPP from "common/util/epp";
import { deepFreeze } from "common/util/other";
import type { Request } from "src/controllers/interface";
import makeGetProjects from "src/controllers/project/get-projects";

const projectService = Object.freeze({
  getProjectById: jest.fn(),
  listProjects: jest.fn(),
});

const getProjects = makeGetProjects({ projectService });

beforeEach(() => {
  Object.values(projectService).forEach((method) => method.mockReset());
});

const fakeProject = Object.freeze({ name: "todo", id: "1" });
const validRequestObject: Request = deepFreeze({
  body: {},
  query: {},
  params: {},
  headers: {},
  method: "get",
  path: "/projects",
});

describe("get /projects", () => {
  it(`calls the projectService.listProjects service if no id parameter is provide`, async () => {
    const fakeServiceResponse = Object.freeze([fakeProject]);
    projectService.listProjects.mockResolvedValueOnce(fakeServiceResponse);

    const response = await getProjects({ ...validRequestObject, params: {} });
    expect(response).toEqual({ body: fakeServiceResponse, error: null });

    expect(projectService.listProjects).toHaveBeenCalledTimes(1);
    expect(projectService.getProjectById).not.toHaveBeenCalled();
  });

  it(`returns the error thrown by projectService.listProjects`, async () => {
    const error = new EPP({
      code: "DB_CORRUPTED",
      message: "The db is corrupted. (by you of course!)",
    });
    projectService.listProjects.mockRejectedValueOnce(error);

    const response = await getProjects({ ...validRequestObject, params: {} });
    expect(response).toEqual({
      body: {},
      error: { code: error.code, message: error.message },
    });

    expect(projectService.listProjects).toHaveBeenCalledTimes(1);
    expect(projectService.getProjectById).not.toHaveBeenCalled();
  });
});

describe("get /projects:id", () => {
  it(`calls the projectService.getProjectById service if an id parameter is provide`, async () => {
    projectService.getProjectById.mockResolvedValueOnce(fakeProject);

    const id = fakeProject.id;

    const response = await getProjects({
      ...validRequestObject,
      params: { id },
    });
    expect(response).toEqual({ body: fakeProject, error: null });

    expect(projectService.getProjectById).toHaveBeenCalledTimes(1);
    expect(projectService.getProjectById).toHaveBeenCalledWith({ id });
    expect(projectService.listProjects).not.toHaveBeenCalled();
  });

  {
    const errorCode = "NOT_FOUND";

    it(`returns an error response with code "${errorCode}" if no project is found with the given id`, async () => {
      // null meaning no project exists with the given id
      projectService.getProjectById.mockResolvedValueOnce(null);

      const id = fakeProject.id;

      const response = await getProjects({
        ...validRequestObject,
        params: { id },
      });

      expect(response).toEqual({
        body: {},
        error: { message: expect.any(String), code: errorCode },
      });

      expect(projectService.getProjectById).toHaveBeenCalledTimes(1);
      expect(projectService.getProjectById).toHaveBeenCalledWith({ id });
      expect(projectService.listProjects).not.toHaveBeenCalled();
    });
  }

  it(`returns an error response if projectService.getProjectById throws an error`, async () => {
    const error = new EPP(`Invalid id`, "INVALID_ID");
    projectService.getProjectById.mockRejectedValueOnce(error);

    const id = fakeProject.id;

    const response = await getProjects({
      ...validRequestObject,
      params: { id },
    });

    expect(response).toEqual({
      body: {},
      error: { message: error.message, code: error.code },
    });

    expect(projectService.getProjectById).toHaveBeenCalledTimes(1);
    expect(projectService.getProjectById).toHaveBeenCalledWith({ id });
    expect(projectService.listProjects).not.toHaveBeenCalled();
  });
});
