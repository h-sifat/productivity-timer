import EPP from "common/util/epp";
import { deepFreeze } from "common/util/other";
import { Request } from "src/controllers/interface";
import makeGetWorkSessions from "src/controllers/work-session/get-work-sessions";

const workSessionService = Object.freeze({
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
  {
    const errorCode = "MISSING_FROM_DATE";

    it(`throws ewc "${errorCode}" if the fromDate query is missing`, async () => {
      const request = { ...defaultRequest, query: {} };

      const response = await getWorkSessions(request);
      expect(response).toEqual({
        body: {},
        error: { message: expect.any(String), code: errorCode },
      });

      for (const service of Object.values(workSessionService))
        expect(service).not.toHaveBeenCalled();
    });
  }
});

describe("Functionality", () => {
  it.each([
    { query: { fromDate: "1/1/2022" } },
    { query: { fromDate: "1/1/2022", toDate: "2/2/2022" } },
  ])(
    `calls the workSessionService.listWorkSessionsByDateRange and returns the response`,
    async ({ query }) => {
      const fakeServiceResponse = [{ startedAt: "1/1/1970" }];
      workSessionService.listWorkSessionsByDateRange.mockResolvedValueOnce(
        fakeServiceResponse
      );

      const request = { ...defaultRequest, query };
      const response = await getWorkSessions(request);

      expect(response).toEqual({ error: null, body: fakeServiceResponse });

      expect(
        workSessionService.listWorkSessionsByDateRange
      ).toHaveBeenCalledTimes(1);

      const expectedServiceCallArgument =
        "toDate" in query
          ? { from: query.fromDate, to: query.toDate }
          : { from: query.fromDate };

      expect(
        workSessionService.listWorkSessionsByDateRange
      ).toHaveBeenCalledWith(expectedServiceCallArgument);
    }
  );

  it(`returns any error thrown by the service(s)`, async () => {
    const error = new EPP("Invalid from date", "INVALID_FROM_DATE");
    workSessionService.listWorkSessionsByDateRange.mockRejectedValueOnce(error);

    const request = { ...defaultRequest, query: { fromDate: "1/1/2022" } };
    const response = await getWorkSessions(request);
    expect(response).toEqual({
      body: {},
      error: { code: error.code, message: error.message },
    });
  });
});
