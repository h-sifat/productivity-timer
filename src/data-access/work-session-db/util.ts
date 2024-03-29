import type {
  WorkSessionInputJSONRecord,
  WorkSessionOutputJSONRecord,
} from "./interface";
import type { WorkSessionFields } from "entities/work-session/work-session";

import { deepFreeze } from "common/util/other";
import { DeepFreezeTypeMapper } from "common/interfaces/other";
import { unixMsTimestampToUsLocaleDateString } from "common/util/date-time";
import { TimerRefWithName } from "src/controllers/timer/interface";

const eventNamesLongToShort = Object.freeze({
  start: "s",
  pause: "p",
  time_up: "t",
  end_manually: "e",
});

const eventNamesShortToLong = Object.freeze({
  s: "start",
  p: "pause",
  t: "time_up",
  e: "end_manually",
});

export function normalizeDocumentToRecord(
  document: WorkSessionFields | DeepFreezeTypeMapper<WorkSessionFields>
): WorkSessionInputJSONRecord {
  const record: Partial<WorkSessionInputJSONRecord> = {};

  record.id = Number(document.id);
  record.targetDuration = document.targetDuration;
  record.startedAt = new Date(document.startedAt).valueOf();
  record.ref = { id: Number(document.ref.id), type: document.ref.type };
  record.elapsedTime = {
    total: document.elapsedTime.total,
    byDate: Object.entries(document.elapsedTime.byDate).map(
      ([dateString, duration]) => [new Date(dateString).valueOf(), duration]
    ),
  };

  record.events = document.events.map(({ name, timestamp }) => ({
    name: eventNamesLongToShort[name],
    timestamp,
  }));

  return record as WorkSessionInputJSONRecord;
}

export function normalizeRecordToDocument(
  record: WorkSessionOutputJSONRecord
): WorkSessionFields {
  const document: Partial<WorkSessionFields<TimerRefWithName>> = {};

  document.id = record.id.toString();
  document.targetDuration = record.targetDuration;
  document.ref = {
    name: record.ref.name,
    type: record.ref.type,
    id: record.ref.id.toString(),
  };
  document.startedAt = unixMsTimestampToUsLocaleDateString(record.startedAt);

  document.elapsedTime = {
    total: record.elapsedTime.total,
    byDate: record.elapsedTime.byDate.reduce((byDate, [date, duration]) => {
      const dateString = unixMsTimestampToUsLocaleDateString(date);
      (byDate as any)[dateString] = duration;
      return byDate;
    }, {}),
  };

  document.events = record.events.map(({ name, timestamp }) => ({
    timestamp,
    name: eventNamesShortToLong[name],
  }));

  deepFreeze(document);

  return document as WorkSessionFields;
}
