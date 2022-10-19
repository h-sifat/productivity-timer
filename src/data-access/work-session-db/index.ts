import type {
  WorkSessionJSONRecord,
  WorkSessionTableRecord,
  WorkSessionTimerEventsRecord,
  WorkSessionCategoryAndProjectIds,
  WorkSessionElapsedTimeByDateRecord,
} from "./interface";

import type {
  WorkSessionFields,
  WorkSessionValidator,
} from "entities/work-session/work-session";
import type SqliteDatabase from "data-access/db/mainprocess-db";
import type WorkSessionDatabaseInterface from "use-cases/interfaces/work-session-db";
import type { QueryMethodArguments as QM_Arguments } from "use-cases/interfaces/work-session-db";

import EPP from "common/util/epp";
import WorkSession from "entities/work-session";
import { DeepFreezeTypeMapper } from "common/interfaces/other";

const assertValidWorkSession: WorkSessionValidator["validate"] =
  WorkSession.validator.validate;

export const TABLE_NAME = "work_sessions";
const WS_JSON_RESULT_COLUMN_NAME = "work_session";
const SELECT_WS_AS_JSON_QUERY_PREFIX = `select json_object(
    'id', ws.id,
    'startedAt', ws.startedAt,
    'targetDuration', ws.targetDuration,

    'ref', 
      json_object(
        'id', ifnull(c.id, p.id),
        'type', iif(c.id is null, 'project', 'category')
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
  insert_work_session: "ws/insert_work_session",
  insert_work_session_elapsed_time_by_date:
    "ws/insert_work_session_elapsed_time_by_date",
  insert_work_session_timer_event: "ws/insert_work_session_timer_event",
  find_work_sessions_by_date_range: "ws/find_work_session_by_date_range",
});

const PREPARED_QUERY_STATEMENTS: {
  [key in keyof typeof PREPARED_QUERY_NAMES]: string;
} = Object.freeze({
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
});

interface BuildWorkSessionDatabase_Argument {
  db: SqliteDatabase;
  notifyDatabaseCorruption: (arg: any) => void;
  normalizeRecordToDocument(record: WorkSessionJSONRecord): WorkSessionFields;
  normalizeDocumentToRecord(
    document: WorkSessionFields | DeepFreezeTypeMapper<WorkSessionFields>
  ): WorkSessionJSONRecord;
}

export default function buildWorkSessionDatabase(
  builderArg: BuildWorkSessionDatabase_Argument
): WorkSessionDatabaseInterface {
  const {
    db,
    notifyDatabaseCorruption,
    normalizeDocumentToRecord,
    normalizeRecordToDocument: __normalizeRecordToDocument__,
  } = builderArg;

  const workSessionDb: WorkSessionDatabaseInterface = Object.freeze({
    insert,
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
        record as WorkSessionJSONRecord
      );

      validate(workSession);

      return workSession;
    }) as WorkSessionFields[];
  }

  // ---------- Utility functions --------------------------
  function validate(
    workSession: any
  ): asserts workSession is WorkSessionFields {
    try {
      assertValidWorkSession(workSession);
    } catch (ex) {
      const errorMessage = `The table ${TABLE_NAME} or it's sub-tables contains invalid record(s).`;

      notifyDatabaseCorruption({
        table: TABLE_NAME,
        message: errorMessage,
        otherInfo: { record: workSession, originalError: ex },
      });

      throw new EPP({
        code: "DB_CORRUPTED",
        otherInfo: { record: workSession, originalError: ex },
        message: errorMessage,
      });
    }
  }

  function normalizeRecordToDocument(record: any): WorkSessionFields {
    try {
      return __normalizeRecordToDocument__(record) as WorkSessionFields;
    } catch (ex) {
      const errorMessage = `Database corrupted! It returned corrupted work-session document.`;

      notifyDatabaseCorruption({
        table: TABLE_NAME,
        message: errorMessage,
        otherInfo: { record, originalError: ex },
      });

      throw new EPP({
        code: "DB_CORRUPTED",
        otherInfo: { record, originalError: ex },
        message: errorMessage,
      });
    }
  }
}
