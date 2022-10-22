import {
  assertValidUSLocaleDateString,
  unixMsTimestampToUsLocaleDateString,
} from "common/util/date-time";
import { SAMPLE_WORK_SESSION } from "fixtures/entities/work-session";
import makeListWorkSessionsByDateRange from "use-cases/work-session/list-by-date-range";

const db = Object.freeze({
  findByDateRange: jest.fn(),
});

const currentTimeMs = jest.fn(() => Date.now());

const builderArg = Object.freeze({
  db,
  currentTimeMs,
  assertValidUSLocaleDateString,
  unixMsTimestampToUsLocaleDateString,
});

const listWorkSessionsByDateRange = makeListWorkSessionsByDateRange(builderArg);

beforeEach(() => {
  currentTimeMs.mockClear();
  Object.values(db).forEach((fn) => fn.mockReset());
});

describe("Validation", () => {
  it.each([
    {
      arg: {},
      errorCode: "MISSING_FROM",
      case: "from is missing",
    },
    {
      arg: {
        to: "1/1/2022",
        from: "123/23/342",
      },
      errorCode: "INVALID_DATE_STRING:FROM",
      case: "from is an invalid date string",
    },
    {
      arg: {
        from: "1/1/2022",
        to: "123/23/342",
      },
      errorCode: "INVALID_DATE_STRING:TO",
      case: "to is an invalid date string",
    },
    {
      arg: {
        to: "1/1/2022",
        from: "2/2/2022",
      },
      errorCode: "FROM_GREATER_THAN_TO",
      case: "from date is greater than to date",
    },
  ])(`throws ewc "$errorCode" if $case`, async ({ arg, errorCode }) => {
    expect.assertions(1);

    try {
      // @ts-ignore
      await listWorkSessionsByDateRange(arg);
    } catch (ex) {
      expect(ex.code).toBe(errorCode);
    }
  });
});

describe("Functionality", () => {
  it(`calls the db.findByDateRange method if from and to is valid`, async () => {
    expect(db.findByDateRange).not.toHaveBeenCalled();

    const returnValue = [SAMPLE_WORK_SESSION];
    db.findByDateRange.mockResolvedValueOnce(returnValue);

    const arg = Object.freeze({
      to: "2/2/2020",
      from: "1/1/2020",
    });

    const workSessions = await listWorkSessionsByDateRange(arg);

    expect(workSessions).toEqual(returnValue);

    expect(db.findByDateRange).toHaveBeenCalledTimes(1);
    expect(db.findByDateRange).toHaveBeenCalledWith(arg);
  });

  it(`uses the current date if the "to" date is not provided`, async () => {
    expect(currentTimeMs).not.toHaveBeenCalled();

    const fromDate = "1/1/2020";
    await listWorkSessionsByDateRange({ from: fromDate });

    const generatedToDate = unixMsTimestampToUsLocaleDateString(
      currentTimeMs.mock.results[0].value
    );

    expect(currentTimeMs).toHaveBeenCalledTimes(1);

    expect(db.findByDateRange).toHaveBeenCalledTimes(1);
    expect(db.findByDateRange).toHaveBeenCalledWith({
      from: fromDate,
      to: generatedToDate,
    });
  });
});
