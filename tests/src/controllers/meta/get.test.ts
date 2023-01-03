import EPP from "common/util/epp";
import { deepFreeze } from "common/util/other";
import { DEFAULT_META_INFO } from "entities/meta";
import { Request } from "src/controllers/interface";
import { makeGetController } from "src/controllers/meta/get";

const service = Object.freeze({
  get: jest.fn(),
});

const getController = makeGetController({ service });
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

describe("Functionality", () => {
  it(`calls the service.get method and returns the response`, async () => {
    const metaInfo = DEFAULT_META_INFO;
    service.get.mockResolvedValueOnce(metaInfo);
    const response = await getController(validRequest);

    expect(response).toEqual({
      body: { success: true, data: metaInfo },
    });

    expect(service.get).toHaveBeenCalledTimes(1);
  });

  it(`returns the error response if the service.get method throws an error`, async () => {
    expect.assertions(2);
    service.get.mockRejectedValueOnce(
      new EPP("The computer said: 'You suck!'", "YOU_SUCK")
    );

    const response = await getController(validRequest);

    expect(response).toEqual({
      body: {
        success: false,
        error: { message: expect.any(String), code: expect.any(String) },
      },
    });

    expect(service.get).toHaveBeenCalledTimes(1);
  });
});
