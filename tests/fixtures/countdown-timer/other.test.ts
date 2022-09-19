import getSeries from "./other";

const initialValue = 1000;
const incrementBy = 5;
let series: ReturnType<typeof getSeries>;

beforeEach(() => {
  series = getSeries({ initialValue, incrementBy });
});

describe("series.currentValue", () => {
  it(`returns the current value`, () => {
    expect(series.currentValue).toBe(initialValue);
  });
});

describe("series.next()", () => {
  it(`increments the currentValue`, () => {
    expect(series.currentValue).toBe(initialValue);

    expect(series.next()).toBe(initialValue + incrementBy);
    expect(series.currentValue).toBe(initialValue + incrementBy);
  });
});
