import { TimerService } from "client/services/timer";
import { deepFreeze } from "common/util/other";

const client = Object.freeze({
  request: jest.fn(),
});

const url = "/timer";
const timerService = new TimerService({
  url,
  client: <any>client,
});

beforeEach(() => {
  Object.values(client).forEach((method) => method.mockReset());
});

const duration = 1;
const ref = Object.freeze({ id: "a", name: "Todo", type: "category" });

const methodCallSchemas = deepFreeze(
  Object.entries({
    end: { command: "end" },
    pause: { command: "pause" },
    getInfo: { command: "info" },
    startBreak: {
      command: "start",
      methodArg: { duration },
      commandArg: { duration, ref: null },
    },
    setDuration: {
      command: "setDuration",
      methodArg: { duration },
      commandArg: { duration },
    },
    reset: {
      command: "reset",
      methodArg: { hard: true, duration },
      commandArg: { hard: true, duration },
    },
    start: {
      command: "start",
      methodArg: { duration, ref },
      commandArg: { duration, ref },
    },
  }).map(([method, value]) => ({
    method,
    ...value,
  }))
);

describe("Error Handling", () => {
  it.each(methodCallSchemas)(
    `the $method throws error if response.body.success is false`,
    async ({ method, command, methodArg, commandArg }: any) => {
      const fakeResponse = deepFreeze({
        body: {
          success: false,
          error: { message: "oops!", code: "err" },
        },
      });
      client.request.mockResolvedValueOnce(fakeResponse);

      expect.assertions(3);

      try {
        await (<any>timerService)[method](methodArg);
      } catch (ex) {
        expect(ex).toEqual(fakeResponse.body.error);
      }

      expect(client.request).toHaveBeenCalledTimes(1);
      expect(client.request).toHaveBeenCalledWith({
        url,
        method: "post",
        body: { command, arg: commandArg },
      });
    }
  );
});

describe("Functionality", () => {
  it.each(methodCallSchemas)(
    `$method: if response.body.success is true then it should return the body.data`,
    async ({ method, command, methodArg, commandArg }: any) => {
      const fakeResponse = deepFreeze({
        body: { success: true, data: { a: 1 } },
      });
      client.request.mockResolvedValueOnce(fakeResponse);

      expect.assertions(3);

      const data = await (<any>timerService)[method](methodArg);

      expect(data).toEqual(fakeResponse.body.data);

      expect(client.request).toHaveBeenCalledTimes(1);
      expect(client.request).toHaveBeenCalledWith({
        url,
        method: "post",
        body: { command, arg: commandArg },
      });
    }
  );
});
