import { deepFreeze } from "common/util/other";
import { Request } from "src/controllers/interface";
import { makeMetaInfoPatchController } from "src/controllers/meta/patch-meta-info";

const service = Object.freeze({
  update: jest.fn(),
});

const metaInfoPatchController = makeMetaInfoPatchController({ service });

const validRequest: Request = deepFreeze({
  body: {},
  query: {},
  params: {},
  headers: {},
  method: "get",
  path: "/projects",
});

beforeEach(() => {
  Object.values(service).forEach((method) => method.mockReset());
});

describe("Validation", () => {
  it.each([
    {
      request: { ...validRequest, body: { changes: [] } },
      case: "request.body.changes is not a plain object",
      errorCode: "INVALID_REQUEST",
    },
    {
      request: { ...validRequest, body: { changes: {}, unknown: "property" } },
      case: "request body contains unknown properties",
      errorCode: "INVALID_REQUEST",
    },
  ])(`throws error if $case`, async ({ request, errorCode }) => {
    expect.assertions(1);

    const response = await metaInfoPatchController(request);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: errorCode,
        message: expect.any(String),
      },
    });
  });
});

describe("Functionality", () => {
  it(`calls the service.update method with the provided changes and returns the response`, async () => {
    const fakeMetaInfo = Object.freeze({ name: "a" });
    service.update.mockResolvedValueOnce(fakeMetaInfo);
    const changes = Object.freeze({ a: 1 });

    const response = await metaInfoPatchController({
      ...validRequest,
      body: { changes },
    });
    expect(response).toEqual({
      body: { success: true, data: fakeMetaInfo },
    });

    expect(service.update).toHaveBeenCalledTimes(1);
    expect(service.update).toHaveBeenCalledWith({
      changes,
      audience: "public",
    });
  });
});
