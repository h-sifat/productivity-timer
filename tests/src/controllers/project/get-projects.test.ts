import EPP from "common/util/epp";
import { deepFreeze } from "common/util/other";
import type { Request } from "src/controllers/interface";
import makeGetProjects from "src/controllers/project/get-projects";

const projectService = Object.freeze({
  findByName: jest.fn(),
  listProjects: jest.fn(),
  getProjectById: jest.fn(),
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

describe("Validation", () => {
  it.each([
    {
      query: {},
      case: "the lookup property is missing",
    },
    {
      query: { lookup: "not_valid" },
      case: "the lookup property is invalid",
    },
    {
      query: { lookup: "not_valid" },
      case: "the lookup property is invalid",
    },
    {
      query: { lookup: "all", unknown: "value" },
      case: "query contains unknown properties",
    },
    {
      query: { lookup: "byId" },
      case: `id is from "byId" lookup query`,
    },
    {
      query: { lookup: "byName" },
      case: `name is from "byName" lookup query`,
    },
  ])(`returns error if $case`, async ({ query }) => {
    const request = { ...validRequestObject, query };
    const response = await getProjects(request);

    expect(response).toEqual({
      body: {},
      error: { message: expect.any(String), code: "INVALID_QUERY" },
    });

    Object.values(projectService).forEach((service) => {
      expect(service).not.toHaveBeenCalled();
    });
  });
});

describe("Functionality", () => {
  it.each([
    {
      query: { lookup: "all" },
      expectedServiceCallArgs: undefined,
      fakeServiceResponse: [fakeProject],
      expectedServiceToCall: "listProjects",
    },
    {
      query: { lookup: "byId", id: "a" },
      expectedServiceCallArgs: { id: "a" },
      fakeServiceResponse: fakeProject,
      expectedServiceToCall: "getProjectById",
    },
    {
      query: { lookup: "byName", name: "a" },
      expectedServiceCallArgs: { name: "a" },
      fakeServiceResponse: fakeProject,
      expectedServiceToCall: "findByName",
    },
  ])(
    `returns the response of "$expectedServiceToCall" service if query is: $query`,
    async ({
      query,
      fakeServiceResponse,
      expectedServiceToCall,
      expectedServiceCallArgs,
    }) => {
      const request = { ...validRequestObject, query };
      const service = (projectService as any)[expectedServiceToCall];
      service.mockResolvedValueOnce(fakeServiceResponse);

      const response = await getProjects(request);
      expect(response).toEqual({
        error: null,
        body: { data: fakeServiceResponse },
      });

      expect(service).toHaveBeenCalledTimes(1);
      if (expectedServiceCallArgs)
        expect(service).toHaveBeenCalledWith(expectedServiceCallArgs);

      Object.entries(projectService).forEach(([name, service]) => {
        if (name === expectedServiceToCall) return;

        expect(service).not.toHaveBeenCalled();
      });
    }
  );
});
