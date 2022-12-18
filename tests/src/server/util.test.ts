import { deepFreeze } from "common/util/other";
import { makeExpressIPCMiddleware } from "src/server/util";

describe("makeExpressIPCMiddleware", () => {
  const controller = jest.fn();
  const debug = jest.fn();
  const next = jest.fn();
  const res = Object.seal({
    headers: {},
    isSent: false,
    send: jest.fn(),
    connectionId: 324,
  });

  const req = deepFreeze({
    method: "post",
    query: { a: 1 },
    path: "/categories",
    params: { id: "23423" },
    extra_prop: "bla bla bla",
    body: { name: "Alex", age: 1 },
    url: "bla/bla/ducklings/categories/",
    headers: { "Content-Type": "application/json" },
  } as const);

  const middleware = makeExpressIPCMiddleware({ controller });

  beforeEach(() => {
    [controller, debug, res.send, next].forEach((f) => f.mockReset());
    res.headers = {};
    res.isSent = false;
  });

  fit(`sends the response from the controller`, async () => {
    const fakeControllerResponse = deepFreeze({
      body: { success: false, data: { name: "a" } },
      headers: { "Content-Type": "application/json" },
    });
    controller.mockResolvedValueOnce(fakeControllerResponse);

    await middleware({ req, res, next }, undefined);

    {
      const { extra_prop, url, ...controllerRequest } = req;
      expect(controller).toHaveBeenCalledTimes(1);
      expect(controller).toHaveBeenCalledWith(controllerRequest);
    }

    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith(fakeControllerResponse.body);
    expect(res.headers).toEqual(fakeControllerResponse.headers);
  });

  it(`returns an error response if the controller throws exception or rejects a promise`, async () => {
    controller.mockRejectedValueOnce(new Error("the server exploded"));

    await middleware({ req, res, next }, undefined);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: { message: expect.any(String), code: "INTERNAL_SERVER_ERROR" },
    });
  });
});
