import { SAMPLE_WORK_SESSION } from "fixtures/entities/work-session";
import makeAddWorkSession from "use-cases/work-session/add-work-session";

const db = Object.freeze({
  insert: jest.fn(),
});
const dbMethodsCount = Object.keys(db).length;

const addWorkSession = makeAddWorkSession({ db });

beforeEach(() => {
  Object.values(db).forEach((fn) => fn.mockReset());
});

describe("Validation", () => {
  {
    const errorCode = "INVALID_ARGUMENT_TYPE";
    it(`throws ewc "${errorCode}" if the argument is not a plain object`, async () => {
      expect.assertions(1 + dbMethodsCount);

      try {
        // @ts-expect-error
        await addWorkSession(null);
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }

      for (const method of Object.values(db))
        expect(method).not.toHaveBeenCalled();
    });
  }

  {
    const errorCode = "MISSING_WORK_SESSION_INFO";

    it(`throws ewc "${errorCode}" if workSessionInfo is missing`, async () => {
      expect.assertions(1 + dbMethodsCount);

      try {
        // @ts-expect-error missing workSessionInfo
        await addWorkSession({});
      } catch (ex: any) {
        expect(ex.code).toBe(errorCode);
      }

      for (const method of Object.values(db))
        expect(method).not.toHaveBeenCalled();
    });
  }

  it(`throws error if work session argument is not valid`, async () => {
    expect.assertions(1);

    const workSessionInfo = {};
    try {
      // @ts-ignore
      await addWorkSession({ workSessionInfo });
    } catch (ex) {
      expect(ex).toBeInstanceOf(Error);
    }
  });
});

describe("Functionality", () => {
  it(`inserts a work session in the db`, async () => {
    const workSessionInfo = { ...SAMPLE_WORK_SESSION };

    // @ts-ignore
    delete workSessionInfo.id;
    expect(workSessionInfo).not.toHaveProperty("id");

    const insertedWorkSession = await addWorkSession({
      workSessionInfo: workSessionInfo,
    });

    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(db.insert).toHaveBeenCalledWith(insertedWorkSession);

    expect(insertedWorkSession).toHaveProperty("id");
    expect(insertedWorkSession).toMatchObject(workSessionInfo);
  });
});
