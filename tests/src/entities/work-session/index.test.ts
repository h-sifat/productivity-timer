import WorkSession from "entities/work-session";
import {
  WorkSessionFields,
  WorkSessionValidator,
} from "entities/work-session/work-session";

const VALID_WORK_SESSION: WorkSessionFields = Object.freeze({
  id: "1",
  startedAt: "1/1/1970",
  targetDuration: 10_000,
  elapsedTime: Object.freeze({
    total: 9_000,
    byDate: { "1/1/1970": 9_000 },
  }),
  events: Object.freeze(
    (
      [
        { name: "start", timestamp: 0 },
        { name: "pause", timestamp: 5_000 },
        { name: "start", timestamp: 9_000 },
        { name: "end_manually", timestamp: 13_000 },
      ] as const
    ).map((e) => Object.freeze(e))
  ),
  ref: Object.freeze({ type: "category", id: "1" } as const),
});

describe("WorkSession.validate", () => {
  const validate: WorkSessionValidator["validate"] =
    WorkSession.validator.validate;

  it(`doesn't throw error if work session is valid`, () => {
    expect(() => {
      validate(VALID_WORK_SESSION);
    }).not.toThrow();
  });

  it(`throws error if workSession is not valid`, () => {
    expect.assertions(1);

    const invalidWorkSession = { ...VALID_WORK_SESSION, elapsedTime: null };

    try {
      validate(invalidWorkSession);
    } catch (ex) {
      expect(ex).toBeInstanceOf(Error);
    }
  });
});

describe("WorkSession.make", () => {
  it(`makes a new id for the given work session`, () => {
    const makeWorkSessionArg = { ...VALID_WORK_SESSION };

    // @ts-ignore
    delete makeWorkSessionArg.id;

    expect(makeWorkSessionArg).not.toHaveProperty("id");

    const workSession = WorkSession.make(makeWorkSessionArg);

    expect(workSession).toHaveProperty("id");
  });

  it(`throws error if workSession is not valid`, () => {
    expect.assertions(1);

    const invalidWorkSession = { ...VALID_WORK_SESSION, elapsedTime: null };

    try {
      // @ts-ignore
      WorkSession.make(invalidWorkSession);
    } catch (ex) {
      expect(ex).toBeInstanceOf(Error);
    }
  });
});
