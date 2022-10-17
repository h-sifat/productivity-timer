import { deepFreeze } from "common/util/other";

describe("deepFreeze", () => {
  it(`deep freezes an object`, () => {
    const object = {
      a: 1,
      b: [{ c: "hi", d: [{ e: "too deep" }] }],
    };

    const frozen = deepFreeze(object);

    expect(object).toBe(frozen);

    expect(Object.isFrozen(object)).toBeTruthy();
    expect(Object.isFrozen(object.b)).toBeTruthy();
    expect(Object.isFrozen(object.b[0])).toBeTruthy();
    expect(Object.isFrozen(object.b[0].d)).toBeTruthy();
    expect(Object.isFrozen(object.b[0].d[0])).toBeTruthy();
  });
});
