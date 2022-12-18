import { deepFreeze } from "common/util/other";
import { Request } from "src/controllers/interface";
import makePatchProject from "src/controllers/project/patch-project";
import EPP from "common/util/epp";

const projectService = Object.freeze({
  editProject: jest.fn(),
});

const patchProject = makePatchProject({ projectService });

beforeEach(() => {
  Object.values(projectService).forEach((method) => method.mockReset());
});

const validRequestObject: Request = deepFreeze({
  body: {},
  query: {},
  params: {},
  headers: {},
  method: "patch",
  path: "/projects",
});

describe("Validation", () => {
  it.each([
    {
      request: {
        ...validRequestObject,
        params: {},
        body: { changes: { name: "x" } },
      },
      errorCode: "MISSING_ID",
      case: `id is missing from params`,
    },
    {
      request: {
        ...validRequestObject,
        body: {},
        params: { id: "1" },
      },
      errorCode: "MISSING_CHANGES",
      case: `changes is missing from body`,
    },
  ])(`returns ewc "$errorCode" if $case`, async ({ errorCode, request }) => {
    const response = await patchProject(request);
    expect(response).toEqual({
      body: {
        success: false,
        error: { message: expect.any(String), code: errorCode },
      },
    });

    Object.values(projectService).forEach((method) => {
      expect(method).not.toHaveBeenCalled();
    });
  });
});

describe("Functionality", () => {
  it(`calls the projectService.editProject with the given id and changes and returns the response`, async () => {
    const id = "1";
    const changes = Object.freeze({ name: "study_hard" });

    const request = {
      ...validRequestObject,
      params: { id },
      body: { changes },
    };
    const fakeEditProjectResponse = Object.freeze({ id, ...changes });
    projectService.editProject.mockResolvedValueOnce(fakeEditProjectResponse);

    const response = await patchProject(request);
    expect(response).toEqual({
      body: { success: true, data: fakeEditProjectResponse },
    });

    expect(projectService.editProject).toHaveBeenCalledTimes(1);
    expect(projectService.editProject).toHaveBeenCalledWith({ id, changes });
  });

  it(`returns the error thrown by projectService.editProject`, async () => {
    const id = "1";
    const changes = Object.freeze({ name: "study_hard" });
    const request = {
      ...validRequestObject,
      params: { id },
      body: { changes },
    };

    const error = new EPP(`No project exists with id: "${id}"`, "NOT_FOUND");
    projectService.editProject.mockRejectedValueOnce(error);

    const response = await patchProject(request);
    expect(response).toEqual({
      body: {
        success: false,
        error: { message: error.message, code: error.code },
      },
    });

    expect(projectService.editProject).toHaveBeenCalledTimes(1);
    expect(projectService.editProject).toHaveBeenCalledWith({ id, changes });
  });
});
