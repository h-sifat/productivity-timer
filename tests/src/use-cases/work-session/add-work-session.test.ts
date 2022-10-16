import { SAMPLE_WORK_SESSION } from "fixtures/work-session";
import buildAddWorkSession from "use-cases/work-session/add-work-session";

const db = Object.freeze({
  insert: jest.fn(),
});

const addWorkSession = buildAddWorkSession({ db });

beforeEach(() => {
  Object.values(db).forEach((fn) => fn.mockReset());
});

describe("Validation", () => {
  it(`throws error if work session argument is not valid`, async () => {
    expect.assertions(1);

    const workSession = {};
    try {
      // @ts-ignore
      await addWorkSession(workSession);
    } catch (ex) {
      expect(ex).toBeInstanceOf(Error);
    }
  });
});

describe("Functionality", () => {
  it(`inserts a work session in the db`, async () => {
    const addWorkSessionArg = { ...SAMPLE_WORK_SESSION };

    // @ts-ignore
    delete addWorkSessionArg.id;
    expect(addWorkSessionArg).not.toHaveProperty("id");

    const insertedWorkSession = await addWorkSession(addWorkSessionArg);

    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(db.insert).toHaveBeenCalledWith(insertedWorkSession);

    expect(insertedWorkSession).toHaveProperty("id");
    expect(insertedWorkSession).toMatchObject(addWorkSessionArg);
  });
});
