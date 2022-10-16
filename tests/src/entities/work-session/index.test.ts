import WorkSession from "entities/work-session";
import { WorkSessionValidator } from "entities/work-session/work-session";
import { SAMPLE_WORK_SESSION } from "fixtures/entities/work-session";

describe("WorkSession.validate", () => {
  const validate: WorkSessionValidator["validate"] =
    WorkSession.validator.validate;

  it(`doesn't throw error if work session is valid`, () => {
    expect(() => {
      validate(SAMPLE_WORK_SESSION);
    }).not.toThrow();
  });

  it(`throws error if workSession is not valid`, () => {
    expect.assertions(1);

    const invalidWorkSession = { ...SAMPLE_WORK_SESSION, elapsedTime: null };

    try {
      validate(invalidWorkSession);
    } catch (ex) {
      expect(ex).toBeInstanceOf(Error);
    }
  });
});

describe("WorkSession.make", () => {
  it(`makes a new id for the given work session`, () => {
    const makeWorkSessionArg = { ...SAMPLE_WORK_SESSION };

    // @ts-ignore
    delete makeWorkSessionArg.id;

    expect(makeWorkSessionArg).not.toHaveProperty("id");

    const workSession = WorkSession.make(makeWorkSessionArg);

    expect(workSession).toHaveProperty("id");
  });

  it(`throws error if workSession is not valid`, () => {
    expect.assertions(1);

    const invalidWorkSession = { ...SAMPLE_WORK_SESSION, elapsedTime: null };

    try {
      // @ts-ignore
      WorkSession.make(invalidWorkSession);
    } catch (ex) {
      expect(ex).toBeInstanceOf(Error);
    }
  });
});
