import EPP from "common/util/epp";
import { deepFreeze } from "common/util/other";
import { Request } from "src/controllers/interface";
import { TimerStates } from "src/countdown-timer/timer";
import { makePostTimerCommand } from "src/controllers/timer/post-command";

const FAKE_TIMER_INFO = Object.freeze({ value: "fake_info" });
const FAKE_TIMER_TIME_INFO = Object.freeze({
  duration: 2312,
  elapsedTime: 3423,
});
const FAKE_TIMER_REF = Object.freeze({ id: "123", type: "category" });

const timer = Object.seal({
  // states
  ref: null,
  info: FAKE_TIMER_INFO,
  timeInfo: FAKE_TIMER_TIME_INFO,
  state: TimerStates[TimerStates.NOT_STARTED],

  // methods
  end: jest.fn(),
  pause: jest.fn(),
  reset: jest.fn(),
  start: jest.fn(),
  setDuration: jest.fn(),
});

const timerMethods = Object.values(timer).filter(
  (value) => typeof value === "function"
);

const DEFAULT_TIMER_DURATION = 20_000;

const postTimerCommand = makePostTimerCommand({
  timer: timer as any,
  DEFAULT_TIMER_DURATION,
});

const validRequestObject: Request = deepFreeze({
  body: {},
  query: {},
  params: {},
  headers: {},
  method: "post",
  path: "/timer",
});

beforeEach(() => {
  timerMethods.forEach((method) => (method as any).mockReset());

  timer.ref = null;
  timer.info = FAKE_TIMER_INFO;
  timer.timeInfo = FAKE_TIMER_TIME_INFO;
  timer.state = TimerStates[TimerStates.NOT_STARTED];
});

describe("Validation", () => {
  it.each([
    {
      command: {},
      case: "is invalid",
    },
    {
      command: { name: "end", unknown: "prop" },
      case: "contains unknown prop",
    },
    {
      command: { name: "unknown" },
      case: "name is invalid",
    },
    {
      command: { name: "reset", duration: -423.43 },
      case: "duration is invalid in reset command",
    },
    {
      command: { name: "start", ref: {} },
      case: "ref is invalid for start method",
    },
    {
      command: { name: "start", ref: { id: "  ", type: "category" } },
      case: "ref is invalid for start method",
    },
    {
      command: { name: "start", ref: { id: "234", type: "project" } },
      case: "ref is invalid for start method",
    },
    {
      command: {
        name: "reset",
        arg: { hardReset: "false" },
      },
      case: `"hardReset" is not a boolean for "reset" command`,
    },
  ])(`error if cmd $case: $request.body`, async ({ command }) => {
    const request = { ...validRequestObject, body: command };
    const response = await postTimerCommand(request);
    expect(response).toEqual({
      body: {
        success: false,
        error: { message: expect.any(String), code: "INVALID_COMMAND" },
      },
    });
  });
});

describe("Functionality", () => {
  it.each([
    { name: "reset" },
    { name: "end", arg: undefined },
    { name: "pause", arg: undefined },
    { name: "reset", arg: { hardReset: true } },
    { name: "setDuration", arg: { duration: 20_000 } },
  ])(
    `the "$name" command calls the "$name" method and returns the response`,
    async ({ name: command, arg = undefined }: any) => {
      const fakeResponse = Object.freeze({
        success: true,
        message: "Not running",
      });
      const expectedTimerMethodToCall = (timer as any)[command];
      expectedTimerMethodToCall.mockReturnValue(fakeResponse);

      const body = { name: command };
      if (arg) {
        (<any>body).arg = arg;
      }

      const response = await postTimerCommand({ ...validRequestObject, body });
      {
        const { success, message } = fakeResponse;
        expect(response).toEqual({ body: { success, data: { message } } });
      }

      expect(expectedTimerMethodToCall).toHaveBeenCalledTimes(1);
    }
  );

  it.each([
    { name: "end" },
    { name: "pause" },
    { name: "start" },
    { name: "reset" },
    { name: "reset", arg: { hardReset: true } },
    { name: "setDuration", arg: { duration: 20_000 } },
  ])(
    `returns the error thrown by the "$name" command`,
    async ({ name: command, arg = undefined }: any) => {
      const errorArg = Object.freeze({ code: "code", message: "msg" });

      (timer as any)[command].mockImplementationOnce(() => {
        throw new EPP(errorArg);
      });

      const body = { name: command };
      if (arg) {
        (<any>body).arg = arg;
      }

      const response = await postTimerCommand({ ...validRequestObject, body });
      expect(response).toEqual({ body: { success: false, error: errorArg } });

      expect((<any>timer)[command]).toHaveBeenCalledTimes(1);
    }
  );

  it.each([
    { command: "info", expected: FAKE_TIMER_INFO },
    { command: "timeInfo", expected: FAKE_TIMER_TIME_INFO },
  ] as const)(
    `the "$command" command returns the value of timer.$command`,
    async ({ command, expected }) => {
      const request = deepFreeze({
        ...validRequestObject,
        body: { name: command },
      });

      timer[command] = expected as any;
      const response = await postTimerCommand(request);
      expect(response).toEqual({ body: { success: true, data: expected } });
    }
  );
});

describe("start", () => {
  const START_COMMAND_WITH_ARG = Object.freeze({
    name: "start",
    arg: { duration: DEFAULT_TIMER_DURATION, ref: FAKE_TIMER_REF },
  });

  it(`returns the response of timer.start method if no arg is provided`, async () => {
    const request = deepFreeze({
      ...validRequestObject,
      body: { name: "start" },
    });

    const fakeResponse = Object.freeze({ success: true, message: "hi!" });
    timer.start.mockReturnValue(fakeResponse);

    const response = await postTimerCommand(request);
    expect(response).toEqual({
      body: { success: true, data: { message: fakeResponse.message } },
    });

    expect(timer.start).toHaveBeenCalledTimes(1);
  });

  it.each(["RUNNING", "PAUSED"] as const)(
    `returns err if timer state is %p and the "start" cmd is issued with an arg`,
    async (timerState) => {
      const request = deepFreeze({
        ...validRequestObject,
        body: START_COMMAND_WITH_ARG,
      });
      timer.state = timerState;

      const response = await postTimerCommand(request);

      expect(response).toEqual({
        body: {
          success: false,
          error: { code: "COMMAND_FAILED", message: expect.any(String) },
        },
      });

      expect(timer.start).not.toHaveBeenCalled();
      expect(timer.reset).not.toHaveBeenCalled();
    }
  );

  it(`returns error if the timer cannot be reset`, async () => {
    const request = deepFreeze({
      ...validRequestObject,
      body: START_COMMAND_WITH_ARG,
    });
    timer.state = "NOT_STARTED";
    timer.reset.mockReturnValue({
      success: false,
      message: "Timer is running",
    });

    const response = await postTimerCommand(request);

    expect(response).toEqual({
      body: {
        success: false,
        error: { code: "COMMAND_FAILED", message: expect.any(String) },
      },
    });

    expect(timer.reset).toHaveBeenCalledTimes(1);
    expect(timer.reset).toHaveBeenCalledWith(START_COMMAND_WITH_ARG.arg);
  });

  it(`calls the start method after calling the reset method`, async () => {
    const request = deepFreeze({
      ...validRequestObject,
      body: START_COMMAND_WITH_ARG,
    });
    timer.state = "ENDED";
    timer.reset.mockReturnValue({
      success: true,
      message: "Timer has been reset",
    });
    timer.start.mockReturnValue({
      success: true,
      message: "Started timer.",
    });

    const response = await postTimerCommand(request);

    expect(response).toEqual({
      body: {
        success: true,
        data: { message: expect.any(String) },
      },
    });

    expect(timer.reset).toHaveBeenCalledTimes(1);
    expect(timer.reset).toHaveBeenCalledWith(START_COMMAND_WITH_ARG.arg);

    expect(timer.start).toHaveBeenCalledTimes(1);
  });
});

describe("reset", () => {
  it(`resets the timer with default duration and existing ref if no arg is provided`, async () => {
    const request = deepFreeze({
      ...validRequestObject,
      body: { name: "reset" },
    });

    const fakeResult = Object.freeze({
      success: true,
      message: "Timer has been reset",
    });

    timer.reset.mockReturnValue(fakeResult);
    timer.ref = FAKE_TIMER_REF as any;

    const response = await postTimerCommand(request);

    expect(response).toEqual({
      body: {
        success: fakeResult.success,
        data: { message: fakeResult.message },
      },
    });

    expect(timer.reset).toHaveBeenCalledTimes(1);
    expect(timer.reset).toHaveBeenCalledWith({
      ref: FAKE_TIMER_REF,
      duration: DEFAULT_TIMER_DURATION,
    });
  });

  it(`resets the ref with null if "hardReset" is true`, async () => {
    const changedDuration = DEFAULT_TIMER_DURATION + 1000;
    const request = deepFreeze({
      ...validRequestObject,
      body: {
        name: "reset",
        arg: { hardReset: true, duration: changedDuration },
      },
    });

    const fakeResult = Object.freeze({
      success: true,
      message: "Timer has been reset",
    });

    timer.reset.mockReturnValue(fakeResult);
    timer.ref = FAKE_TIMER_REF as any;

    const response = await postTimerCommand(request);

    expect(response).toEqual({
      body: {
        success: fakeResult.success,
        data: { message: fakeResult.message },
      },
    });

    expect(timer.reset).toHaveBeenCalledTimes(1);
    expect(timer.reset).toHaveBeenCalledWith({
      ref: null,
      duration: changedDuration,
    });
  });
});

describe("setDuration", () => {
  it(`sets the new duration`, async () => {
    const changedDuration = DEFAULT_TIMER_DURATION + 1000;
    const request = deepFreeze({
      ...validRequestObject,
      body: {
        name: "setDuration",
        arg: { duration: changedDuration },
      },
    });

    const fakeResult = Object.freeze({
      success: true,
      message: "Changed duration",
    });

    timer.setDuration.mockReturnValue(fakeResult);

    const response = await postTimerCommand(request);

    expect(response).toEqual({
      body: {
        success: fakeResult.success,
        data: { message: fakeResult.message },
      },
    });

    expect(timer.setDuration).toHaveBeenCalledTimes(1);
    expect(timer.setDuration).toHaveBeenCalledWith(changedDuration);
  });
});