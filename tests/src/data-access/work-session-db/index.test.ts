import _internalDb_, { initializeDatabase } from "data-access/db";

import buildWorkSessionDatabase, {
  TABLE_NAME as WORK_SESSION_TABLE_NAME,
} from "data-access/work-session-db";

import { SAMPLE_WORK_SESSION } from "fixtures/entities/work-session";
import WorkSessionDatabaseInterface from "use-cases/interfaces/work-session-db";
import {
  normalizeDocumentToRecord,
  normalizeRecordToDocument,
} from "data-access/work-session-db/util";
import buildCategoryDatabase from "data-access/category-db";
import CategoryDatabaseInterface from "use-cases/interfaces/category-db";
import Category from "entities/category";
import { deepFreeze } from "common/util/other";

const IN_MEMORY_DB_PATH = ":memory:";
const notifyDatabaseCorruption = jest.fn();

let workSessionDb: WorkSessionDatabaseInterface;
let categoryDb: CategoryDatabaseInterface;

// -----    Test setup -----------------
beforeEach(async () => {
  await _internalDb_.open({ path: IN_MEMORY_DB_PATH });
  await initializeDatabase(_internalDb_);

  if (!workSessionDb)
    workSessionDb = buildWorkSessionDatabase({
      db: _internalDb_,
      notifyDatabaseCorruption,
      normalizeDocumentToRecord,
      normalizeRecordToDocument,
    });

  if (!categoryDb)
    categoryDb = buildCategoryDatabase({
      db: _internalDb_,
      notifyDatabaseCorruption: () => {},
    });
});

afterEach(async () => {
  await _internalDb_.close();
  notifyDatabaseCorruption.mockReset();
});

afterAll(async () => {
  await _internalDb_.kill();
});
// -----    Test setup -----------------

describe("insert", () => {
  it.each([
    {
      workSession: {
        ...SAMPLE_WORK_SESSION,
        ref: { id: "1", type: "category" } as const,
      },
      case: "a workSession's category doesn't exist",
      errorCode: "SQLITE_CONSTRAINT_FOREIGNKEY",
    },
    {
      workSession: {
        ...SAMPLE_WORK_SESSION,
        ref: { id: "1", type: "project" } as const,
      },
      case: "a workSession's project doesn't exist",
      errorCode: "SQLITE_CONSTRAINT_FOREIGNKEY",
    },
  ])(`throws ewc "$errorCode" if $case`, async ({ workSession, errorCode }) => {
    expect.assertions(1);

    try {
      // as our categories and project table is empty it should throw an
      // foreign key constraint violation error because the work_session table
      // references the id of projects and categories table.
      await workSessionDb.insert(workSession);
    } catch (ex) {
      expect(ex.code).toBe(errorCode);
    }
  });

  it(`inserts a workSession`, async () => {
    const category = Category.make({ name: "study" });

    const workSession = {
      ...SAMPLE_WORK_SESSION,
      ref: { id: category.id, type: "category" } as const,
    };

    await categoryDb.insert(category);
    await workSessionDb.insert(workSession);

    const results = await workSessionDb.findByDateRange({
      from: workSession.startedAt,
      to: workSession.startedAt,
    });

    expect(results).toHaveLength(1);
    expect(results).toEqual([workSession]);
  });
});

describe("findByDateRange", () => {
  it(`returns an empty array if no workSession is found`, async () => {
    const workSessions = await workSessionDb.findByDateRange({
      to: "2/2/2023",
      from: "1/1/2022",
    });
    expect(workSessions).toHaveLength(0);
  });

  it(`only returns data within the date range `, async () => {
    const category = Category.make({ name: "study" });

    await categoryDb.insert(category);

    const workSessions = {
      "10/19/2022": {
        id: "1",
        ref: { type: "category", id: category.id },
        elapsedTime: {
          total: 1500000,
          byDate: { "10/19/2022": 899000, "10/20/2022": 601000 },
        },
        events: [
          { name: "start", timestamp: 1666201500000 },
          { name: "time_up", timestamp: 1666203000000 },
        ],
        startedAt: "10/19/2022",
        targetDuration: 1500000,
      },
      "10/18/2022": {
        id: "2",
        ref: { type: "category", id: category.id },
        elapsedTime: {
          total: 1500000,
          byDate: { "10/18/2022": 899000, "10/19/2022": 601000 },
        },
        events: [
          { name: "start", timestamp: 1666115100000 },
          { name: "time_up", timestamp: 1666116600000 },
        ],
        startedAt: "10/18/2022",
        targetDuration: 1500000,
      },
      "10/17/2022": {
        id: "3",
        ref: { type: "category", id: category.id },
        elapsedTime: {
          total: 1500000,
          byDate: { "10/17/2022": 889000, "10/18/2022": 611000 },
        },
        events: [
          { name: "start", timestamp: 1666028700000 },
          { name: "pause", timestamp: 1666029200000 },
          { name: "start", timestamp: 1666029210000 },
          { name: "time_up", timestamp: 1666030210000 },
        ],
        startedAt: "10/17/2022",
        targetDuration: 1500000,
      },
    };

    deepFreeze(workSessions);

    for (const workSession of Object.values(workSessions))
      await workSessionDb.insert(workSession as any);

    const fromDate = "10/17/2022";
    const toDate = "10/18/2022";

    const sortPredicate = (wsA: any, wSB: any) =>
      Number(wsA.id) - Number(wSB.id);

    const result = await workSessionDb.findByDateRange({
      from: fromDate,
      to: toDate,
    });

    result.sort(sortPredicate);

    const expectResult = [workSessions[fromDate], workSessions[toDate]].sort(
      sortPredicate
    );

    expect(result).toHaveLength(2);
    expect(result).toEqual(expectResult);
  });
});

describe("Handling Data Corruption", () => {
  {
    const errorCode = "DB_CORRUPTED";

    it(`handles database corruption and throws ewc "${errorCode}"`, async () => {
      expect.assertions(4);

      const category = Category.make({ name: "study" });

      const workSession = {
        ...SAMPLE_WORK_SESSION,
        ref: { id: category.id, type: "category" } as const,
      };

      await categoryDb.insert(category);
      await workSessionDb.insert(workSession);

      // setting the elapsedTime.total to negative value which is invalid
      await _internalDb_.execute({
        sql: `update ${WORK_SESSION_TABLE_NAME}
        set totalElapsedTime = -32423 
        where id = ${workSession.id};`,
      });

      expect(notifyDatabaseCorruption).not.toHaveBeenCalled();

      try {
        await workSessionDb.findByDateRange({
          from: workSession.startedAt,
          to: workSession.startedAt,
        });
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }

      expect(notifyDatabaseCorruption).toHaveBeenCalledTimes(1);
      expect(notifyDatabaseCorruption).toHaveBeenCalledWith({
        table: WORK_SESSION_TABLE_NAME,
        message: expect.any(String),
        otherInfo: expect.any(Object),
      });
    });
  }
});
