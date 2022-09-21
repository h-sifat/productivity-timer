import createFakeIntervalTimer from "./interval-timer";

let timer: ReturnType<typeof createFakeIntervalTimer>;

beforeEach(() => {
  timer = createFakeIntervalTimer();
});

describe("fakeSetInterval", () => {
  it(`sets a timer with a new id`, () => {
    const interval = 100;
    const callback = () => {};

    const id = timer.fakeSetInterval({ interval, callback });

    expect(id).toBeDefined();
    expect(id).toBe(timer.getCurrentFakeTimerId());

    expect(timer.allFakeTimers).toHaveProperty(id, { interval, callback });
  });
});

describe("fakeClearInterval", () => {
  it(`clears an interval timer`, () => {
    const id = timer.fakeSetInterval({ interval: 1, callback: () => {} });

    expect(timer.allFakeTimers).toHaveProperty(id);

    timer.fakeClearInterval(id);

    expect(timer.allFakeTimers).not.toHaveProperty(id);
  });
});

describe("clearAllFakeTimers", () => {
  it(`clears all interval timers`, () => {
    const id = timer.fakeSetInterval({ interval: 1, callback: () => {} });

    expect(timer.allFakeTimers).toHaveProperty(id);

    timer.clearAllFakeTimers();

    expect(timer.allFakeTimers).not.toHaveProperty(id);
  });
});

describe("manualTick", () => {
  it(`calls the interval callback`, () => {
    const callback = jest.fn();

    const id = timer.fakeSetInterval({ interval: 1, callback });

    expect(callback).toHaveBeenCalledTimes(0);

    timer.manualTick(id);

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
