import { Client } from "express-ipc";
import { deepFreeze } from "common/util/other";
import ProjectService from "client/services/project";

const url = "/projects";
const client = Object.freeze({
  request: jest.fn(),
});

const validArgs: { [k: string]: any } = deepFreeze({
  add: { name: "a" },
  findAll: undefined,
  findById: { id: "a" },
  delete: { id: "a" },
  findByName: { name: "a" },
  edit: { id: "a", name: "b" },
});

let projectService: ProjectService;
beforeEach(() => {
  Object.values(client).forEach((fn) => fn.mockReset());
  projectService = new ProjectService({
    url,
    client: client as unknown as Client,
  });
});

describe("Error Handling", () => {
  it.each(Object.keys(validArgs))(
    `%p method throws the body.error if body.success is false`,
    async (method) => {
      expect.assertions(2);

      const fakeResponse = deepFreeze({
        body: {
          success: false,
          error: { message: "hmmm, interesting!", code: "err" },
        },
      });
      client.request.mockResolvedValueOnce(fakeResponse);

      try {
        await (<any>projectService)[method]((<any>validArgs)[method]);
      } catch (ex) {
        expect(ex).toEqual(fakeResponse.body.error);
      }

      expect(client.request).toHaveBeenCalledTimes(1);
    }
  );
});

describe("Functionality", () => {
  it.each([
    {
      serviceMethod: "findAll",
      arg: undefined,
      requestArg: { method: "get", url, query: { lookup: "all" } },
    },
    {
      serviceMethod: "findById",
      arg: { id: "a" },
      requestArg: { method: "get", url, query: { lookup: "byId", id: "a" } },
    },
    {
      serviceMethod: "delete",
      arg: { id: "a" },
      requestArg: { method: "delete", url, query: { id: "a" } },
    },
    {
      serviceMethod: "findByName",
      arg: { name: "a" },
      requestArg: {
        method: "get",
        url,
        query: { lookup: "byName", name: "a" },
      },
    },
    {
      serviceMethod: "add",
      arg: { name: "a" },
      requestArg: { method: "post", url, body: { name: "a" } },
    },
    {
      serviceMethod: "edit",
      arg: { id: "1", changes: { name: "a" } },
      requestArg: {
        url,
        method: "patch",
        body: { id: "1", changes: { name: "a" } },
      },
    },
  ])(
    `the Service.$serviceMethod issues a "$requestArg.method" method and returns body.data if body.success is true`,
    async ({ serviceMethod, arg, requestArg }) => {
      const fakeResponse = deepFreeze({
        body: { success: true, data: { a: 1 } },
      });
      client.request.mockResolvedValueOnce(fakeResponse);

      const data = await (<any>projectService)[serviceMethod](arg);

      expect(data).toEqual(fakeResponse.body.data);
      expect(client.request).toHaveBeenCalledTimes(1);
      expect(client.request).toHaveBeenCalledWith(requestArg);
    }
  );
});
