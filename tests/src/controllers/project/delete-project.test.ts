import EPP from "common/util/epp";
import { deepFreeze } from "common/util/other";
import { Request } from "src/controllers/interface";
import makeDeleteProject from "src/controllers/project/delete-project";

const projectService = Object.freeze({
  removeProject: jest.fn(),
});

const deleteProject = makeDeleteProject({ projectService });

beforeEach(() => {
  Object.values(projectService).forEach((method) => method.mockReset());
});

const fakeProject = Object.freeze({ name: "todo", id: 1 });
const validRequestObject: Request = deepFreeze({
  body: {},
  query: {},
  params: {},
  headers: {},
  method: "delete",
  path: "/projects",
});

describe("Validation", () => {
  it.each([
    {
      request: {
        ...validRequestObject,
        params: {},
      },
      errorCode: "MISSING_ID",
      case: `id is missing from params`,
    },
  ])(`returns ewc "$errorCode" if $case`, async ({ errorCode, request }) => {
    const response = await deleteProject(request);
    expect(response).toEqual({
      body: {},
      error: { message: expect.any(String), code: errorCode },
    });

    Object.values(projectService).forEach((method) => {
      expect(method).not.toHaveBeenCalled();
    });
  });
});

describe("Functionality", () => {
  it(`calls the projectService.removeProject with the given id and returns the response`, async () => {
    const id = "1";
    const request = { ...validRequestObject, params: { id } };

    const fakeEditProjectResponse = [fakeProject];
    projectService.removeProject.mockResolvedValueOnce(fakeEditProjectResponse);

    const response = await deleteProject(request);
    expect(response).toEqual({
      error: null,
      body: fakeEditProjectResponse,
    });

    expect(projectService.removeProject).toHaveBeenCalledTimes(1);
    expect(projectService.removeProject).toHaveBeenCalledWith({ id });
  });

  it(`returns the error thrown by projectService.removeProject`, async () => {
    const id = "1";
    const request = { ...validRequestObject, params: { id } };

    const error = new EPP(`No project exists with id: "${id}"`, "NOT_FOUND");
    projectService.removeProject.mockRejectedValueOnce(error);

    const response = await deleteProject(request);
    expect(response).toEqual({
      body: {},
      error: { message: error.message, code: error.code },
    });

    expect(projectService.removeProject).toHaveBeenCalledTimes(1);
    expect(projectService.removeProject).toHaveBeenCalledWith({ id });
  });
});
