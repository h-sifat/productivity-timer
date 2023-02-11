import type {
  AssertValidUnixMsTimestamp,
  AssertValidUSLocaleDateString,
  UnixMsTimestampToUsLocaleDateString,
} from "common/interfaces/date-time";
import type { ID } from "common/interfaces/id";

import EPP from "common/util/epp";
import { assert } from "handy-types";
import required from "common/util/required";
import { DeepFreeze, DeepFreezeTypeMapper } from "common/interfaces/other";

export type EventLog = {
  timestamp: number;
  name: "start" | "pause" | "time_up" | "end_manually";
};

export const VALID_EVENT_NAMES = Object.freeze([
  "start",
  "pause",
  "time_up",
  "end_manually",
] as const);

export type TimerRef = {
  id: string;
  type: "project" | "category";
};

export type ElapsedTime = {
  total: number;
  byDate: { [date: string]: number };
};

export type WorkSessionFields = {
  id: string;
  ref: TimerRef;
  startedAt: string;
  events: EventLog[];
  targetDuration: number;
  elapsedTime: ElapsedTime;
};

export interface WorkSessionValidator {
  assertValidId(id: unknown): asserts id is WorkSessionFields["id"];
  assertValidReference(ref: unknown): asserts ref is WorkSessionFields["ref"];

  assertValidEvents(
    events: unknown,
    other: {
      targetDuration: number;
      MAX_ALLOWED_ELAPSED_TIME_DIFF: number;
    }
  ): asserts events is WorkSessionFields["events"];

  assertValidStartedAt(
    startedAt: unknown,
    firstStartEventTimestamp: number
  ): asserts startedAt is WorkSessionFields["startedAt"];

  assertValidTargetDuration(
    targetDuration: unknown
  ): asserts targetDuration is WorkSessionFields["targetDuration"];

  assertValidElapsedTime(
    elapsedTime: unknown,
    other: {
      startedAt: WorkSessionFields["startedAt"];
      targetDuration: WorkSessionFields["targetDuration"];
    }
  ): asserts elapsedTime is WorkSessionFields["elapsedTime"];

  validate(workSession: object): asserts workSession is WorkSessionFields;
}

export type MakeWorkSession_Argument =
  | Omit<WorkSessionFields, "id">
  | DeepFreezeTypeMapper<Omit<WorkSessionFields, "id">>;

export interface WorkSessionEntity {
  make(arg: MakeWorkSession_Argument): Readonly<WorkSessionFields>;
  validator: WorkSessionValidator;
}

export interface BuildWorkSessionEntity_Argument {
  Id: ID;
  deepFreeze: DeepFreeze;
  MAX_ALLOWED_ELAPSED_TIME_DIFF: number;
  assertValidUnixMsTimestamp: AssertValidUnixMsTimestamp;
  assertValidUSLocaleDateString: AssertValidUSLocaleDateString;
  unixMsTimestampToUsLocaleDateString: UnixMsTimestampToUsLocaleDateString;
}

export default function buildWorkSessionEntity(
  builderArg: BuildWorkSessionEntity_Argument
) {
  const {
    Id,
    deepFreeze,
    assertValidUnixMsTimestamp,
    MAX_ALLOWED_ELAPSED_TIME_DIFF,
    unixMsTimestampToUsLocaleDateString,
  } = builderArg;
  const assertValidUSLocaleDateString: AssertValidUSLocaleDateString =
    builderArg.assertValidUSLocaleDateString;

  const validator: WorkSessionValidator = Object.freeze({
    validate,
    assertValidId,
    assertValidEvents,
    assertValidReference,
    assertValidStartedAt,
    assertValidElapsedTime,
    assertValidTargetDuration,
  });

  return Object.freeze({ validator, make });

  function make(
    workSessionArg: MakeWorkSession_Argument
  ): DeepFreezeTypeMapper<WorkSessionFields> {
    const id = Id.makeId();
    validate({ ...workSessionArg, id });

    {
      const { ref, events, elapsedTime } = workSessionArg;

      const workSession = deepFreeze({
        ...workSessionArg,
        id,
        ref: { ...ref },
        elapsedTime: {
          total: elapsedTime.total,
          byDate: { ...elapsedTime.byDate },
        },
        events: events.map((e) => ({ ...e })),
      });

      return workSession;
    }
  }

  function validate(
    workSession: object
  ): asserts workSession is WorkSessionFields {
    assert<WorkSessionFields>("plain_object", workSession, {
      name: "WorkSession",
      code: "IWS:NOT_PLAIN_OBJECT",
    });

    const {
      id = required("id"),
      ref = required("ref"),
      events = required("events"),
      startedAt = required("startedAt"),
      elapsedTime = required("elapsedTime"),
      targetDuration = required("targetDuration"),
    } = workSession;

    assertValidId(id);
    assertValidReference(ref);
    assertValidTargetDuration(targetDuration);

    assertValidEvents(events, {
      targetDuration,
      MAX_ALLOWED_ELAPSED_TIME_DIFF,
    });

    assertValidStartedAt(startedAt, events[0].timestamp);
    assertValidElapsedTime(elapsedTime, { targetDuration, startedAt });
  }

  function assertValidElapsedTime(
    elapsedTime: unknown,
    otherArg: {
      startedAt: WorkSessionFields["startedAt"];
      targetDuration: WorkSessionFields["targetDuration"];
    }
  ): asserts elapsedTime is WorkSessionFields["elapsedTime"] {
    const { startedAt, targetDuration } = otherArg;

    assert<ElapsedTime>("plain_object", elapsedTime, {
      name: "elapsedTime",
      code: "IET:NOT_PLAIN_OBJECT",
    });

    assert<number>("non_negative_integer", elapsedTime.total, {
      name: "elapsedTime.total",
      code: "IET:TOTAL:NOT_NON_NEGATIVE_INTEGER",
    });

    assert<ElapsedTime["byDate"]>("plain_object", elapsedTime.byDate, {
      name: "elapsedTime.byDate",
      code: "IET:BY_DATE:NOT_PLAIN_OBJECT",
    });

    if (elapsedTime.total > targetDuration)
      throw new EPP({
        code: "IET:TOTAL_GREATER_THAN_TARGET_DURATION",
        message: "elapsedTime.total cannot be greater than the targetDuration.",
      });

    if (!(startedAt in elapsedTime.byDate))
      throw new EPP({
        code: "IET:BY_DATE:MISSING_STARTED_AT_DATE",
        message: `The startedAt date doesn't exist in the elapsedTime.byDate object`,
      });

    {
      const startedAtDate = new Date(startedAt);
      for (const dateString of Object.keys(elapsedTime.byDate)) {
        assertValidUSLocaleDateString(
          dateString,
          "IET:BY_DATE:HAS_INVALID_DATE"
        );

        if (+new Date(dateString) < +startedAtDate)
          throw new EPP({
            code: "IET:BY_DATE:HAS_DATE_LESS_THAN_STARTED_AT",
            message:
              "The elapsedTime.byDate cannot have date less than the startedAt date",
          });
      }
    }

    {
      const calculatedTotalElapsedTime = Object.values(
        elapsedTime.byDate
      ).reduce((a, c) => a + c);

      if (calculatedTotalElapsedTime !== elapsedTime.total)
        throw new EPP({
          code: "IET:TOTAL_NOT_EQUAL_CALCULATED_BY_DATE_TOTAL",
          message:
            "Invalid elapsedTime. The elapsedTime.total not equal total calculated from byDate",
        });
    }
  }

  function assertValidStartedAt(
    startedAt: unknown,
    firstStartEventTimestamp: number
  ): asserts startedAt is WorkSessionFields["startedAt"] {
    assertValidUSLocaleDateString(startedAt, "INVALID_STARTED_AT_DATE");

    if (
      startedAt !==
      unixMsTimestampToUsLocaleDateString(firstStartEventTimestamp)
    )
      throw new EPP({
        code: "INVALID_STARTED_AT_DATE",
        message: `The "startedAt" date must be equal to the date of first start event timestamp`,
      });
  }

  function assertValidId(id: unknown): asserts id is WorkSessionFields["id"] {
    if (!Id.isValid(id))
      throw new EPP(`Invalid work session id: ${id}.`, "INVALID_ID");
  }

  function assertValidTargetDuration(
    targetDuration: unknown
  ): asserts targetDuration is WorkSessionFields["targetDuration"] {
    assert<number>("positive_integer", targetDuration, {
      name: "targetDuration",
      code: "INVALID_TARGET_DURATION",
    });
  }

  function assertValidEvents(
    events: any,
    other: {
      targetDuration: number;
      MAX_ALLOWED_ELAPSED_TIME_DIFF: number;
    }
  ): asserts events is WorkSessionFields["events"] {
    const { targetDuration, MAX_ALLOWED_ELAPSED_TIME_DIFF } = other;

    assert.cache<EventLog[]>("plain_object[]", events, {
      name: "events",
      code: "INVALID_EVENTS:NOT_PLAIN_OBJECT_ARRAY",
    });

    const timer = new FakeTimerForEventsValidation({
      targetDuration,
      assertValidUnixMsTimestamp,
      MAX_ALLOWED_ELAPSED_TIME_DIFF,
    });
    for (const event of events) timer.executeEvent(event);

    timer.assertIsFinished();
  }

  function assertValidReference(ref: unknown): asserts ref is TimerRef {
    assert<object>("plain_object", ref, {
      name: "WorkSessionReference",
      code: "INVALID_REF:NOT_PLAIN_OBJECT",
    });

    const {
      id = required("id", "INVALID_REF:MISSING_ID"),
      type = required("type", "INVALID_REF:MISSING_TYPE"),
    } = <TimerRef>ref;

    assert<string>("non_empty_string", id, {
      name: "TimerRef.id",
      code: "INVALID_REF:INVALID_ID",
    });

    if (type !== "project" && type !== "category")
      throw new EPP({
        code: "INVALID_REF:INVALID_TYPE",
        message: `Invalid TimerRef.type: "${type}"`,
      });
  }
}

interface FakeTimerForEventsValidation_ConstructorArgument {
  targetDuration: number;
  MAX_ALLOWED_ELAPSED_TIME_DIFF: number;
  assertValidUnixMsTimestamp: AssertValidUnixMsTimestamp;
}
class FakeTimerForEventsValidation {
  #elapsedTime = 0;
  #state = "not_started";
  #lastEventTimestamp: number | undefined;

  readonly #targetDuration: number;
  readonly #assertValidUnixMsTimestamp: AssertValidUnixMsTimestamp;
  readonly #MAX_ALLOWED_ELAPSED_TIME_DIFF: number;

  constructor(arg: FakeTimerForEventsValidation_ConstructorArgument) {
    this.#targetDuration = arg.targetDuration;
    this.#assertValidUnixMsTimestamp = arg.assertValidUnixMsTimestamp;
    this.#MAX_ALLOWED_ELAPSED_TIME_DIFF = arg.MAX_ALLOWED_ELAPSED_TIME_DIFF;
  }

  executeEvent(event: any) {
    const missingFieldErrorCode = "INVALID_EVENTS:EVENT_MISSING_FIELD";
    const {
      name = required("name", missingFieldErrorCode),
      timestamp = required("timestamp", missingFieldErrorCode),
    } = event;

    // @ts-ignore
    if (name in this) this[name](timestamp);
    else
      throw new EPP({
        code: "INVALID_EVENTS:INVALID_EVENT_NAME",
        message: `Invalid event name: "${event.name}"`,
      });
  }

  protected start(timestamp: any) {
    this.#assertValidTimestamp(timestamp);

    const canStart = ["paused", "not_started"].includes(this.#state);
    if (!canStart) this.#throwInvalidEventOrder();

    this.#state = "running";

    this.#lastEventTimestamp = timestamp;
  }

  protected pause(timestamp: any) {
    this.#assertValidTimestamp(timestamp);

    const canPause = this.#state === "running";

    if (!canPause) this.#throwInvalidEventOrder();

    this.#state = "paused";
    this.#incrementElapsedTime(timestamp);

    this.#lastEventTimestamp = timestamp;
  }

  protected end_manually(timestamp: any) {
    this.#assertValidTimestamp(timestamp);

    const canEnd = ["paused", "running"].includes(this.#state);
    if (!canEnd) this.#throwInvalidEventOrder();

    if (this.#state !== "paused") this.#incrementElapsedTime(timestamp);

    this.#assertElapsedNotTooGreaterThanTargetDuration();

    this.#state = "ended";
    this.#lastEventTimestamp = timestamp;
  }

  protected time_up(timestamp: any) {
    this.#assertValidTimestamp(timestamp);

    const canTimeUp = this.#state === "running";
    if (!canTimeUp) this.#throwInvalidEventOrder();

    this.#state = "timed_up";
    this.#incrementElapsedTime(timestamp);

    this.#lastEventTimestamp = timestamp;

    if (this.#elapsedTime < this.#targetDuration)
      throw new EPP({
        message: `Events has the "timed_up" event but calculated elapsed time (${
          this.#elapsedTime
        }) is less than target duration (${this.#targetDuration}).`,
        code: "INVALID_EVENTS:CALCULATED_ELAPSED_TIME_LESS_THAN_TARGET_DURATION",
      });

    this.#assertElapsedNotTooGreaterThanTargetDuration();
  }

  #assertElapsedNotTooGreaterThanTargetDuration() {
    const isElapsedTooGreaterThanTargetDuration =
      this.#elapsedTime - this.#targetDuration >
      this.#MAX_ALLOWED_ELAPSED_TIME_DIFF;

    if (isElapsedTooGreaterThanTargetDuration)
      throw new EPP({
        code: "INVALID_EVENTS:CALCULATED_ELAPSED_TIME_TOO_GREATER_THAN_TARGET_DURATION",
        message: `The difference between calculated elapsed time and target duration cannot be greater than ${
          this.#MAX_ALLOWED_ELAPSED_TIME_DIFF
        }ms.`,
      });
  }

  #assertValidTimestamp(timestamp: unknown): asserts timestamp is number {
    this.#assertValidUnixMsTimestamp(
      timestamp,
      "INVALID_EVENTS:INVALID_EVENT_TIMESTAMP"
    );

    if (this.#lastEventTimestamp && timestamp < this.#lastEventTimestamp)
      throw new EPP({
        code: "INVALID_EVENTS:INVALID_TIMESTAMP_ORDER",
        message: `The timestamp of an event must not be less than it's previous one.`,
      });
  }

  #incrementElapsedTime(timestamp: number) {
    this.#elapsedTime += timestamp - this.#lastEventTimestamp!;
  }

  #throwInvalidEventOrder() {
    throw new EPP({
      code: "INVALID_EVENTS:INVALID_EVENT_ORDER",
      message: `Invalid event order.`,
    });
  }

  get elapsedTime() {
    return this.#elapsedTime;
  }

  get state() {
    return this.#state;
  }

  assertIsFinished() {
    if (!["ended", "timed_up"].includes(this.#state))
      throw new EPP({
        code: "INVALID_EVENTS:NO_ENDING_EVENT",
        message: `The last timer event should be "time_up" or "end_manually"`,
      });
  }
}
