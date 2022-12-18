import EPP from "common/util/epp";
import { deepFreeze } from "common/util/other";
import type { Request } from "src/controllers/interface";
import makePostProject from "src/controllers/project/post-project";

const projectService = Object.freeze({
  addProject: jest.fn(),
});

const postProject = makePostProject({ projectService });

beforeEach(() => {
  Object.values(projectService).forEach((method) => method.mockReset());
});

const validRequestObject: Request = deepFreeze({
  query: {},
  params: {},
  headers: {},
  method: "post",
  path: "/projects",
  body: { name: "study" },
});

describe("Functionality", () => {
  it(`passes the request.body to the addProject service and returns the response`, async () => {
    const fakeProject = Object.freeze({ name: "study", id: "1" });
    projectService.addProject.mockResolvedValueOnce(fakeProject);

    const response = await postProject(validRequestObject);
    expect(response).toEqual({
      body: { success: true, data: fakeProject },
    });

    expect(projectService.addProject).toHaveBeenCalledTimes(1);
    expect(projectService.addProject).toHaveBeenCalledWith({
      projectInfo: validRequestObject.body,
    });
  });

  it(`returns any error in the error property of the response`, async () => {
    const error = new EPP(`You suck!`, "YOU_SUCK");
    projectService.addProject.mockRejectedValueOnce(error);

    const response = await postProject(validRequestObject);
    expect(response).toEqual({
      body: {
        success: false,
        error: { code: error.code, message: error.message },
      },
    });

    expect(projectService.addProject).toHaveBeenCalledTimes(1);
    expect(projectService.addProject).toHaveBeenCalledWith({
      projectInfo: validRequestObject.body,
    });
  });
});
