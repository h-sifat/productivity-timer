import EPP from "common/util/epp";
import { deepFreeze } from "common/util/other";
import { Request } from "src/controllers/interface";
import makeGetWorkSessions from "src/controllers/work-session/get-work-sessions";

const workSessionService = Object.freeze({
  getStats: jest.fn(),
  listWorkSessionsByDateRange: jest.fn(),
});

const getWorkSessions = makeGetWorkSessions({ workSessionService });

beforeEach(() => {
  Object.values(workSessionService).forEach((service) => service.mockReset());
});

const defaultRequest: Request = deepFreeze({
  body: {},
  query: {},
  params: {},
  headers: {},
  method: "get",
  path: "work-sessions",
});

describe("Validation", () => {
  it.each([
    {
      query: { lookup: "work-sessions", arg: {} },
      case: `throws error if query.lookup = "work-sessions" and "from" is missing from query.arg`,
    },
    {
      query: { lookup: "work-sessions", arg: { from: "" } },
      case: `throws error if query.lookup = "work-sessions" and "from" is not a non-empty string`,
    },
    {
      query: { lookup: "unknown", arg: { a: 1 } },
      case: `throws error if query.lookup  is invalid`,
    },
  ] as const)(`$case`, async ({ query }) => {
    const request = { ...defaultRequest, query: {} };
    const response = await getWorkSessions(request);
    expect(response).toMatchObject({
      body: {
        success: false,
        error: { message: expect.any(String) },
      },
    });

    for (const service of Object.values(workSessionService))
      expect(service).not.toHaveBeenCalled();
  });
});

describe("Functionality", () => {
  it.each([
    {
      query: { lookup: "work-sessions", arg: { from: "1/1/2022" } },
      serviceName: "listWorkSessionsByDateRange",
      serviceCallArg: { from: "1/1/2022" },
    },
    {
      query: {
        lookup: "work-sessions",
        arg: { from: "1/1/2022", to: "2/2/2022" },
      },
      serviceCallArg: { from: "1/1/2022", to: "2/2/2022" },
      serviceName: "listWorkSessionsByDateRange",
    },
    {
      query: { lookup: "stats" },
      serviceName: "getStats",
      serviceCallArg: undefined,
    },
  ])(
    `calls the workSessionService.$serviceName and returns the response`,
    async ({ query, serviceName, serviceCallArg = undefined }) => {
      const fakeServiceResponse = [{ startedAt: "1/1/1970" }];
      const service = (workSessionService as any)[serviceName];

      service.mockResolvedValueOnce(fakeServiceResponse);

      const request = { ...defaultRequest, query };
      const response = await getWorkSessions(request);

      expect(response).toEqual({
        body: { success: true, data: fakeServiceResponse },
      });

      expect(service).toHaveBeenCalledTimes(1);

      if (serviceCallArg) expect(service).toHaveBeenCalledWith(serviceCallArg);
    }
  );
});

describe("Error Handling", () => {
  it.each([
    {
      query: { lookup: "stats" },
      serviceName: "getStats",
    },
    {
      serviceName: "listWorkSessionsByDateRange",
      query: { lookup: "work-sessions", arg: { from: "1/1/2022" } },
    },
  ])(
    `query.lookup: "$query.lookup" | returns error if $serviceName throws error`,
    async ({ serviceName, query }) => {
      const fakeError = new EPP("Your code sucks.", "code_sucks");
      const service = (workSessionService as any)[serviceName];
      service.mockRejectedValueOnce(fakeError);

      const request = { ...defaultRequest, query };
      const response = await getWorkSessions(request);

      expect(response).toEqual({
        body: {
          success: false,
          error: { message: fakeError.message, code: fakeError.code },
        },
      });

      expect(service).toHaveBeenCalledTimes(1);
    }
  );
});
