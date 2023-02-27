import type {
  WorkSessionTableRecord,
  WorkSessionInputJSONRecord,
  WorkSessionOutputJSONRecord,
  WorkSessionTimerEventsRecord,
  WorkSessionCategoryAndProjectIds,
  WorkSessionElapsedTimeByDateRecord,
} from "./interface";

import type {
  WorkSessionFields,
  WorkSessionValidator,
} from "entities/work-session/work-session";
import type SqliteDatabase from "data-access/db/mainprocess-db";
import type { TimerRefWithName } from "src/controllers/timer/interface";
import type WorkSessionDatabaseInterface from "use-cases/interfaces/work-session-db";
import type { QueryMethodArguments as QM_Arguments } from "use-cases/interfaces/work-session-db";

import EPP from "common/util/epp";
import WorkSession from "entities/work-session";
import { MakeGetMaxId } from "data-access/interface";
import { DeepFreezeTypeMapper } from "common/interfaces/other";
import { validateDailyStat } from "./stats";
import { deepFreeze } from "common/util/other";

const assertValidWorkSession: WorkSessionValidator["validate"] =
  WorkSession.validator.validate;

export const TABLE_NAME = "work_sessions";
const MAX_ID_COLUMN_NAME = "max_id";
const WS_JSON_RESULT_COLUMN_NAME = "work_session";
const SELECT_WS_AS_JSON_QUERY_PREFIX = `select json_object(
    'id', ws.id,
    'startedAt', ws.startedAt,
    'targetDuration', ws.targetDuration,

    'ref', 
      json_object(
        'id', ifnull(c.id, p.id),
        'type', iif(c.id is null, 'project', 'category'),
        'name', iif(c.id is null, p.name, c.name)
      ),

    'events', (
        select json_group_array( json_object('name', name, 'timestamp', timestamp))
        from work_session_timer_events as wste
        where wste.work_session_id = ws.id
        order by wste.timestamp
      ),

    'elapsedTime',
      json_object(
       'total', ws.totalElapsedTime,
       'byDate', (
          select json_group_array( json_array(date, elapsed_time_ms))
          from work_session_elapsed_time_by_date as wsetbd
          where wsetbd.work_session_id = ws.id
        )
      )
  ) as ${WS_JSON_RESULT_COLUMN_NAME}
  from work_sessions ws
  left join categories c
    on ws.categoryId = c.id
  left join projects p
    on ws.projectId = p.id\n`;
// no semi-colon at the end so that other clauses can be appended to it

const PREPARED_QUERY_NAMES = Object.freeze({
  getMaxId: "ws/getMaxId",
  getStats: "ws/getStats",
  insert_work_session: "ws/insert_work_session",
  insert_work_session_elapsed_time_by_date:
    "ws/insert_work_session_elapsed_time_by_date",
  insert_work_session_timer_event: "ws/insert_work_session_timer_event",
  find_work_sessions_by_date_range: "ws/find_work_session_by_date_range",
});

const PREPARED_QUERY_STATEMENTS: {
  [key in keyof typeof PREPARED_QUERY_NAMES]: string;
} = Object.freeze({
  getMaxId: `select max(id) as ${MAX_ID_COLUMN_NAME} from ${TABLE_NAME};`,
  insert_work_session: `insert into work_sessions
  (id, startedAt, targetDuration, totalElapsedTime, projectId, categoryId)
  values ($id, $startedAt, $targetDuration, $totalElapsedTime, $projectId, $categoryId);`,

  insert_work_session_elapsed_time_by_date: `insert into work_session_elapsed_time_by_date
  (work_session_id, date, elapsed_time_ms)
  values ($work_session_id, $date, $elapsed_time_ms);`,

  insert_work_session_timer_event: `insert into work_session_timer_events
  (work_session_id, name, timestamp)
  values ($work_session_id, $name, $timestamp);`,

  find_work_sessions_by_date_range:
    SELECT_WS_AS_JSON_QUERY_PREFIX +
    "where ws.startedAt >= $fromDate AND ws.startedAt <= $toDate;",

  getStats: `select 
    json_object(
        'date', date,
        'totalDurationMs', sum(duration),
        'durationPerRefs', json_group_array(
          json_object('duration', duration, 'ref', json_object('id', id, 'type', type, 'name', name))
        )
    ) as data
  from (
    select 
      date, id, type, name, sum(elapsed_time_ms) as duration
    from (
      /* ----- Getting ref (id, type) --------- */
      select
        elapsed_time_ms,
        wsetbd.date as date,
        /* || '' -> converts number id to string */
        ifnull(ws.categoryId, ws.projectId) || '' as id,
        iif(ws.categoryId is null, 'project', 'category') as type,
        iif(ws.categoryId is null, p.name, c.name) as name
      from work_session_elapsed_time_by_date as wsetbd
      left join work_sessions as ws
        on ws.id = wsetbd.work_session_id
      left join categories c
        on ws.categoryId = c.id
      left join projects p
        on ws.projectId = p.id
      /* ----- End Getting ref (id, type) --------- */
    )
    group by date, id, type
    order by date asc
  )
  group by date;`,
});

interface BuildWorkSessionDatabase_Argument {
  db: SqliteDatabase;
  makeGetMaxId: MakeGetMaxId;
  notifyDatabaseCorruption: (arg: any) => void;
  normalizeRecordToDocument(
    record: WorkSessionOutputJSONRecord
  ): WorkSessionFields;
  normalizeDocumentToRecord(
    document: WorkSessionFields | DeepFreezeTypeMapper<WorkSessionFields>
  ): WorkSessionInputJSONRecord;
}

export default function buildWorkSessionDatabase(
  builderArg: BuildWorkSessionDatabase_Argument
): WorkSessionDatabaseInterface {
  const {
    db,
    makeGetMaxId,
    notifyDatabaseCorruption,
    normalizeDocumentToRecord,
    normalizeRecordToDocument: __normalizeRecordToDocument__,
  } = builderArg;

  const getMaxId = makeGetMaxId({
    db,
    maxIdColumnName: MAX_ID_COLUMN_NAME,
    preparedQueryName: PREPARED_QUERY_NAMES.getMaxId,
    preparedQueryStatement: PREPARED_QUERY_STATEMENTS.getMaxId,
  });

  const workSessionDb: WorkSessionDatabaseInterface = Object.freeze({
    insert,
    getMaxId,
    getStats,
    findByDateRange,
  });

  return workSessionDb;

  // ------------ db methods ----------------------------------------------

  async function insert(workSession: QM_Arguments["insert"]) {
    const record = normalizeDocumentToRecord(workSession);

    const workSessionRecord: WorkSessionTableRecord = (() => {
      const { id, startedAt, targetDuration, elapsedTime, ref } = record;

      const projectAndCategoryIds: WorkSessionCategoryAndProjectIds =
        ref.type === "project"
          ? { projectId: ref.id, categoryId: null }
          : { projectId: null, categoryId: ref.id };

      return {
        id,
        startedAt,
        targetDuration,
        ...projectAndCategoryIds,
        totalElapsedTime: elapsedTime.total,
      };
    })();

    const workSessionElapsedTimeByDateRecords: WorkSessionElapsedTimeByDateRecord[] =
      (() => {
        const { byDate } = record.elapsedTime;

        return byDate.map(([date, elapsed_time_ms]) => ({
          date,
          elapsed_time_ms,
          work_session_id: record.id,
        }));
      })();

    const workSessionTimerEventsRecords: WorkSessionTimerEventsRecord[] =
      (() => {
        const { events, id } = record;

        return events.map((nameAndTimestamp) => ({
          ...nameAndTimestamp,
          work_session_id: id,
        }));
      })();

    await db.prepare({
      overrideIfExists: false,
      name: PREPARED_QUERY_NAMES.insert_work_session,
      statement: PREPARED_QUERY_STATEMENTS.insert_work_session,
    });

    await db.prepare({
      overrideIfExists: false,
      name: PREPARED_QUERY_NAMES.insert_work_session_timer_event,
      statement: PREPARED_QUERY_STATEMENTS.insert_work_session_timer_event,
    });

    await db.prepare({
      overrideIfExists: false,
      name: PREPARED_QUERY_NAMES.insert_work_session_elapsed_time_by_date,
      statement:
        PREPARED_QUERY_STATEMENTS.insert_work_session_elapsed_time_by_date,
    });

    const transaction = await db.startTransaction("exclusive");

    try {
      await transaction.runPrepared({
        statementArgs: workSessionRecord,
        name: PREPARED_QUERY_NAMES.insert_work_session,
      });

      for (const elapsedTimeRecord of workSessionElapsedTimeByDateRecords)
        await transaction.runPrepared({
          statementArgs: elapsedTimeRecord,
          name: PREPARED_QUERY_NAMES.insert_work_session_elapsed_time_by_date,
        });

      for (const timerEventRecord of workSessionTimerEventsRecords)
        await transaction.runPrepared({
          statementArgs: timerEventRecord,
          name: PREPARED_QUERY_NAMES.insert_work_session_timer_event,
        });

      await transaction.end("commit");
    } catch (ex) {
      try {
        await transaction.end("rollback");
      } catch {}

      throw ex;
    }
  }

  async function findByDateRange(arg: QM_Arguments["findByDateRange"]) {
    const toDate = new Date(arg.to).valueOf();
    const fromDate = new Date(arg.from).valueOf();

    await db.prepare({
      overrideIfExists: false,
      name: PREPARED_QUERY_NAMES.find_work_sessions_by_date_range,
      statement: PREPARED_QUERY_STATEMENTS.find_work_sessions_by_date_range,
    });

    const workSessionJSONRecords = (
      await db.executePrepared({
        statementArgs: { fromDate, toDate },
        name: PREPARED_QUERY_NAMES.find_work_sessions_by_date_range,
      })
    ).map((record: any) => JSON.parse(record[WS_JSON_RESULT_COLUMN_NAME]));

    return workSessionJSONRecords.map((record) => {
      const workSession = normalizeRecordToDocument(
        record as WorkSessionOutputJSONRecord
      );

      validate(workSession);

      return workSession;
    }) as WorkSessionFields<TimerRefWithName>[];
  }

  async function getStats() {
    db.prepare({
      overrideIfExists: false,
      name: PREPARED_QUERY_NAMES.getStats,
      statement: PREPARED_QUERY_STATEMENTS.getStats,
    });

    const dailyStats = (await db.executePrepared({
      name: PREPARED_QUERY_NAMES.getStats,
    })) as { data: string }[];

    const stats = dailyStats.map((dailyStat) => JSON.parse(dailyStat.data));

    try {
      return deepFreeze(validateDailyStat(stats)) as any;
    } catch (ex) {
      throwDatabaseCorruptedError({ originalError: ex, record: dailyStats });
    }
  }

  // ---------- Utility functions --------------------------
  function validate(
    workSession: any
  ): asserts workSession is WorkSessionFields {
    try {
      assertValidWorkSession(workSession);
    } catch (ex) {
      throwDatabaseCorruptedError({ originalError: ex, record: workSession });
    }
  }

  function normalizeRecordToDocument(record: any): WorkSessionFields {
    try {
      return __normalizeRecordToDocument__(record) as WorkSessionFields;
    } catch (ex) {
      throwDatabaseCorruptedError({
        record,
        originalError: ex,
        message: `Database corrupted! It returned corrupted work-session document.`,
      });
    }
  }

  function throwDatabaseCorruptedError(arg: {
    record: any;
    message?: string;
    originalError: any;
  }): never {
    const {
      record,
      originalError,
      message = `The table ${TABLE_NAME} or it's sub-tables contains invalid record(s).`,
    } = arg;

    notifyDatabaseCorruption({
      message: message,
      table: TABLE_NAME,
      otherInfo: { record, originalError },
    });

    throw new EPP({
      message: message,
      code: "DB_CORRUPTED",
      otherInfo: { record, originalError },
    });
  }
}
