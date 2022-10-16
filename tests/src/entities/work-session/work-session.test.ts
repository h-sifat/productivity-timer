import { ID } from "common/interfaces/id";
import {
  assertValidUnixMsTimestamp,
  assertValidUSLocaleDateString,
  unixMsTimestampToUsLocaleDateString,
} from "common/util/date-time";
import { isValid } from "common/util/id";
import { SAMPLE_WORK_SESSION } from "fixtures/entities/work-session";
import buildWorkSessionEntity, {
  EventLog,
  WorkSessionValidator,
} from "entities/work-session/work-session";

const makeId = jest.fn().mockReturnValue("1234");
const Id: ID = { isValid, makeId };
const MAX_ALLOWED_ELAPSED_TIME_DIFF = 5000; // 5s

const WorkSession = buildWorkSessionEntity({
  Id,
  assertValidUnixMsTimestamp,
  MAX_ALLOWED_ELAPSED_TIME_DIFF,
  assertValidUSLocaleDateString,
  unixMsTimestampToUsLocaleDateString,
});

describe("WorkSession.validator.assertValidEvents", () => {
  const assertValidEvents: WorkSessionValidator["assertValidEvents"] =
    WorkSession.validator.assertValidEvents;

  const makeEvent = (name: any, timestamp: any): EventLog => ({
    name,
    timestamp,
  });

  const DEFAULT_TARGET_DURATION = 5000;
  const DEFAULT_MAX_ALLOWED_ELAPSED_TIME_DIFF = 5000;

  it.each([
    {
      events: null,
      errorCode: "INVALID_EVENTS:NOT_PLAIN_OBJECT_ARRAY",
      case: "events is not a plain_object array",
    },
    {
      events: [makeEvent("start", 1), ["not_plain_object"]],
      errorCode: "INVALID_EVENTS:NOT_PLAIN_OBJECT_ARRAY",
      case: "events is not a plain_object array",
    },
    {
      events: [{}],
      errorCode: "INVALID_EVENTS:EVENT_MISSING_FIELD",
      case: "event object is missing both name and timestamp fields",
    },
    {
      events: [{ name: "start" }],
      errorCode: "INVALID_EVENTS:EVENT_MISSING_FIELD",
      case: "event object is missing timestamp field",
    },
    {
      events: [{ timestamp: 1212 }],
      errorCode: "INVALID_EVENTS:EVENT_MISSING_FIELD",
      case: "event object is missing name field",
    },
    {
      events: [{ name: 2343, timestamp: 2342 }],
      errorCode: "INVALID_EVENTS:INVALID_EVENT_NAME",
      case: "event name is invalid (number)",
    },
    {
      events: [{ name: "quack", timestamp: 2342 }],
      errorCode: "INVALID_EVENTS:INVALID_EVENT_NAME",
      case: "event name is unknown",
    },
    {
      events: [{ name: "start", timestamp: -23234.23423 }],
      errorCode: "INVALID_EVENTS:INVALID_EVENT_TIMESTAMP",
      case: "event timestamp is invalid (negative float)",
    },
    {
      events: [{ name: "start", timestamp: 234.23423 }],
      errorCode: "INVALID_EVENTS:INVALID_EVENT_TIMESTAMP",
      case: "event timestamp is invalid (positive float)",
    },
    {
      events: [makeEvent("pause", 1)],
      errorCode: "INVALID_EVENTS:INVALID_EVENT_ORDER",
      case: "events starts with pause event",
    },
    {
      events: [makeEvent("end_manually", 1)],
      errorCode: "INVALID_EVENTS:INVALID_EVENT_ORDER",
      case: "events starts with end_manually event",
    },
    {
      events: [makeEvent("time_up", 1)],
      errorCode: "INVALID_EVENTS:INVALID_EVENT_ORDER",
      case: "events starts with time_up event",
    },
    {
      events: [makeEvent("start", 200), makeEvent("pause", 100)],
      errorCode: "INVALID_EVENTS:INVALID_TIMESTAMP_ORDER",
      case: "a event's timestamp is less than the previous one",
    },
    {
      events: [makeEvent("start", 100), makeEvent("start", 200)],
      errorCode: "INVALID_EVENTS:INVALID_EVENT_ORDER",
      case: "a start event follows another start event",
    },
    {
      events: [
        makeEvent("start", 100),
        makeEvent("pause", 200),
        makeEvent("pause", 300),
      ],
      errorCode: "INVALID_EVENTS:INVALID_EVENT_ORDER",
      case: "a pause event follows another pause event",
    },
    {
      events: [
        makeEvent("start", 100),
        makeEvent("end_manually", 200),
        makeEvent("end_manually", 300),
      ],
      errorCode: "INVALID_EVENTS:INVALID_EVENT_ORDER",
      case: "a end_manually event follows another end_manually event",
    },
    {
      events: [makeEvent("start", 100), makeEvent("time_up", 200)],
      targetDuration: 300,
      errorCode:
        "INVALID_EVENTS:CALCULATED_ELAPSED_TIME_LESS_THAN_TARGET_DURATION",
      case: "timer times up but calculated elapsedTime is less than targetDuration",
    },
    {
      events: [makeEvent("start", 0), makeEvent("time_up", 10_000)],
      targetDuration: 1000,
      MAX_ALLOWED_ELAPSED_TIME_DIFF: 5000,
      case: "timer times up but elapsedTime is too greater than the targetDuration",
      errorCode:
        "INVALID_EVENTS:CALCULATED_ELAPSED_TIME_TOO_GREATER_THAN_TARGET_DURATION",
    },
    {
      events: [makeEvent("start", 0), makeEvent("end_manually", 10_000)],
      targetDuration: 1000,
      MAX_ALLOWED_ELAPSED_TIME_DIFF: 5000,
      case: "timer was ended manually but elapsedTime is too greater than the targetDuration",
      errorCode:
        "INVALID_EVENTS:CALCULATED_ELAPSED_TIME_TOO_GREATER_THAN_TARGET_DURATION",
    },
    {
      events: [
        makeEvent("start", 100),
        makeEvent("time_up", 200),
        makeEvent("end_manually", 300),
      ],
      targetDuration: 100,
      errorCode: "INVALID_EVENTS:INVALID_EVENT_ORDER",
      case: "a end_manually event follows the time_up event",
    },
    {
      events: [
        makeEvent("start", 100),
        makeEvent("end_manually", 200),
        makeEvent("time_up", 300),
      ],
      errorCode: "INVALID_EVENTS:INVALID_EVENT_ORDER",
      case: "a time_up event happens after end_manually event",
    },
    {
      events: [
        makeEvent("start", 100),
        makeEvent("pause", 200),
        makeEvent("time_up", 300),
      ],
      errorCode: "INVALID_EVENTS:INVALID_EVENT_ORDER",
      case: "the time_up event follows a pause event",
    },
    {
      events: [makeEvent("start", 100), makeEvent("pause", 200)],
      errorCode: "INVALID_EVENTS:NO_ENDING_EVENT",
      case: "if events doesn't end with time_up or end_manually event",
    },
  ])(
    `throws ewc "$errorCode" if $case`,
    // @ts-ignore
    (arg: any) => {
      const {
        events,
        errorCode,
        targetDuration = DEFAULT_TARGET_DURATION,
        MAX_ALLOWED_ELAPSED_TIME_DIFF = DEFAULT_MAX_ALLOWED_ELAPSED_TIME_DIFF,
      } = arg;

      expect(() => {
        assertValidEvents(events, {
          targetDuration,
          MAX_ALLOWED_ELAPSED_TIME_DIFF,
        });
      }).toThrowErrorWithCode(errorCode);
    }
  );

  it(`doesn't throw error events is valid`, () => {
    const events = [
      makeEvent("start", 100),
      makeEvent("pause", 200), // 100ms
      makeEvent("start", 400),
      makeEvent("time_up", 600), // 300ms
    ];

    expect(() => {
      assertValidEvents(events, {
        targetDuration: 300, // 300ms
        MAX_ALLOWED_ELAPSED_TIME_DIFF: DEFAULT_MAX_ALLOWED_ELAPSED_TIME_DIFF,
      });
    }).not.toThrow();
  });
});

describe("WorkSession.validator.assertValidTargetDuration", () => {
  const assertValidTargetDuration: WorkSessionValidator["assertValidTargetDuration"] =
    WorkSession.validator.assertValidTargetDuration;

  it(`throws error if targetDuration is not a positive_integer`, () => {
    expect(() => {
      assertValidTargetDuration(342.23423);
    }).toThrowErrorWithCode("INVALID_TARGET_DURATION");
  });

  it(`doesn't throw error if targetDuration is a positive_integer`, () => {
    expect(() => {
      assertValidTargetDuration(200);
    }).not.toThrow();
  });
});

describe("WorkSession.validator.assertValidId", () => {
  const assertValidId: WorkSessionValidator["assertValidId"] =
    WorkSession.validator.assertValidId;

  it(`throws error if id is not a numeric string of positive_integer`, () => {
    expect(() => {
      assertValidId("234223.234234");
    }).toThrowErrorWithCode("INVALID_ID");
  });

  it(`doesn't throw error id is a string of positive_integer`, () => {
    expect(() => {
      assertValidId("1");
    }).not.toThrow();
  });
});

describe("WorkSession.validator.assertValidReference", () => {
  const assertValidReference: WorkSessionValidator["assertValidReference"] =
    WorkSession.validator.assertValidReference;

  it.each([
    {
      ref: ["not_a_plain_object"],
      case: "not a plain object",
      errorCode: "INVALID_REF:NOT_PLAIN_OBJECT",
    },
    {
      ref: { type: "category" },
      case: "the id field is missing",
      errorCode: "INVALID_REF:MISSING_ID",
    },
    {
      ref: { id: "23432" },
      case: "the type field is missing",
      errorCode: "INVALID_REF:MISSING_TYPE",
    },
    {
      ref: { id: "", type: "project" },
      case: "the id is not a non_empty_string",
      errorCode: "INVALID_REF:INVALID_ID",
    },
    {
      ref: { id: "23423", type: "" },
      case: "the value of type is neither 'category' nor 'project'",
      errorCode: "INVALID_REF:INVALID_TYPE",
    },
  ])(`throws ewc "$errorCode" if $case`, ({ ref, errorCode }) => {
    expect(() => {
      assertValidReference(ref);
    }).toThrowErrorWithCode(errorCode);
  });

  it(`doesn't throw error if TimerRef is valid`, () => {
    expect(() => {
      assertValidReference({ id: "123", type: "category" });
    }).not.toThrow();

    expect(() => {
      assertValidReference({ id: "123", type: "project" });
    }).not.toThrow();
  });
});

describe("WorkSession.validator.assertValidStartedAt", () => {
  const assertValidStartedAt: WorkSessionValidator["assertValidStartedAt"] =
    WorkSession.validator.assertValidStartedAt;
  const errorCode = "INVALID_STARTED_AT_DATE";

  it(`throws error if the date string is not a valid us locale date string`, () => {
    expect(() => {
      assertValidStartedAt("20/20/2020", 1243532);
    }).toThrowErrorWithCode(errorCode);
  });

  it(`throws error the date of firstStartEventTimestamp is not equal to startedAt`, () => {
    const firstStartEventTimestamp = new Date("1/20/2022").valueOf();

    expect(() => {
      assertValidStartedAt("1/25/2022", firstStartEventTimestamp);
    }).toThrowErrorWithCode(errorCode);
  });

  it(`doesn't throw error is startedAt date is valid and is equal to the date of firstStartEventTimestamp`, () => {
    const startedAt = "1/20/2022";
    const firstStartEventTimestamp = new Date(startedAt).valueOf();

    expect(() => {
      assertValidStartedAt(startedAt, firstStartEventTimestamp);
    }).not.toThrow();
  });
});

describe("WorkSession.validator.assertValidElapsedTime", () => {
  const assertValidElapsedTime: WorkSessionValidator["assertValidElapsedTime"] =
    WorkSession.validator.assertValidElapsedTime;

  const otherArg = Object.freeze({
    startedAt: "1/1/2022",
    targetDuration: 5000, // 5s
  });

  it.each([
    {
      otherArg,
      elapsedTime: null,
      case: "elapsedTime is not a plain_object",
      errorCode: "IET:NOT_PLAIN_OBJECT",
    },
    {
      otherArg,
      elapsedTime: { total: -234.324, byDate: {} },
      errorCode: "IET:TOTAL:NOT_NON_NEGATIVE_INTEGER",
      case: "elapsedTime.total is not a non_negative_integer",
    },
    {
      otherArg,
      errorCode: "IET:BY_DATE:NOT_PLAIN_OBJECT",
      case: "elapsedTime.byDate is not a plain_object",
      elapsedTime: { total: 0, byDate: ["not_plain_object"] },
    },
    {
      otherArg,
      errorCode: "IET:TOTAL_GREATER_THAN_TARGET_DURATION",
      case: "elapsedTime.total greater than targetDuration",
      elapsedTime: {
        total: otherArg.targetDuration + 1000,
        byDate: { [otherArg.startedAt]: otherArg.targetDuration + 1000 },
      },
    },
    {
      otherArg: { targetDuration: 6000, startedAt: "1/1/2022" },
      errorCode: "IET:BY_DATE:MISSING_STARTED_AT_DATE",
      case: "the startedAt date doesn't exist in the elapsedTime.byDate object",
      elapsedTime: { total: 3000, byDate: { "2/2/2022": 3000 } },
    },
    {
      otherArg: { startedAt: "1/1/2022", targetDuration: 3000 },
      errorCode: "IET:BY_DATE:HAS_INVALID_DATE",
      case: "the elapsedTime.byDate contains invalid date",
      elapsedTime: {
        total: 3000,
        byDate: { "200/1002/2022": 1000, "1/1/2022": 2000 },
      },
    },
    {
      otherArg: { targetDuration: 3000, startedAt: "2/2/2022" },
      errorCode: "IET:BY_DATE:HAS_DATE_LESS_THAN_STARTED_AT",
      case: "the elapsedTime.byDate object has date less than the startedAt date",
      elapsedTime: {
        total: 3000,
        byDate: { "1/1/2022": 2000, "2/2/2022": 1000 },
      },
    },
    {
      otherArg: { targetDuration: 4000, startedAt: "1/1/2022" },
      errorCode: "IET:TOTAL_NOT_EQUAL_CALCULATED_BY_DATE_TOTAL",
      case: "the elapsedTime.total !== total calculated from byDate",
      elapsedTime: {
        total: 4000,
        byDate: { "1/1/2022": 2000, "1/2/2022": 1000 },
      },
    },
  ])(
    `throws ewc "$errorCode" if $case`,
    ({ elapsedTime, otherArg, errorCode }) => {
      expect(() => {
        // @ts-ignore
        assertValidElapsedTime(elapsedTime, otherArg);
      }).toThrowErrorWithCode(errorCode);
    }
  );

  it(`doesn't throw error if elapsedTime is valid`, () => {
    expect(() => {
      const startedAt = "1/1/2022";
      const elapsedTime = {
        total: 4000,
        byDate: {
          [startedAt]: 3000,
          "1/2/2022": 1000,
        },
      };

      assertValidElapsedTime(elapsedTime, { startedAt, targetDuration: 5000 });
    }).not.toThrow();
  });
});

describe("WorkSession.validator.validate", () => {
  const validate: WorkSessionValidator["validate"] =
    WorkSession.validator.validate;

  {
    const errorCode = "IWS:NOT_PLAIN_OBJECT";
    it(`throws ewc "${errorCode}" if workSession is not a plain object`, () => {
      expect(() => {
        validate(["not_plain_object"]);
      }).toThrowErrorWithCode(errorCode);
    });
  }

  it.each([
    "id",
    "ref",
    "events",
    "startedAt",
    "elapsedTime",
    "targetDuration",
  ])(`throws error if property %p is missing`, (property) => {
    expect.assertions(1);
    try {
      const workSession = { ...SAMPLE_WORK_SESSION };

      // @ts-ignore
      delete workSession[property];

      validate(workSession);
    } catch (ex) {
      const errorCode = "MISSING_" + property.toUpperCase();
      expect(ex.code).toBe(errorCode);
    }
  });

  {
    const errorCode = "INVALID_ID";
    it(`throws ewc "${errorCode}" if id is not valid`, () => {
      expect(() => {
        validate({ ...SAMPLE_WORK_SESSION, id: "not_valid_id" });
      }).toThrowErrorWithCode(errorCode);
    });
  }

  it(`throws error if ref is invalid`, () => {
    expect(() => {
      validate({ ...SAMPLE_WORK_SESSION, ref: "bla_bla" });
    }).toThrowError();
  });

  it(`throws error if events is not valid `, () => {
    expect(() => {
      validate({ ...SAMPLE_WORK_SESSION, events: [] });
    }).toThrowError();
  });

  it(`throws error if target duration is not valid `, () => {
    expect(() => {
      validate({ ...SAMPLE_WORK_SESSION, targetDuration: 0 });
    }).toThrowError();
  });

  it(`throws error if elapsedTime is not valid`, () => {
    expect(() => {
      validate({ ...SAMPLE_WORK_SESSION, elapsedTime: {} });
    }).toThrowError();
  });

  it(`throws error if startedAt date is not valid`, () => {
    expect(() => {
      validate({ ...SAMPLE_WORK_SESSION, startedAt: "23/23/2022" });
    }).toThrowError();
  });

  it(`doesn't throw error if everything is valid`, () => {
    expect(() => {
      validate(SAMPLE_WORK_SESSION);
    }).not.toThrowError();
  });
});

describe("WorkSession.make", () => {
  it(`makes a workSession object if everything is valid`, () => {
    const makeWorkSessionArg = { ...SAMPLE_WORK_SESSION };
    // @ts-ignore
    delete makeWorkSessionArg.id;

    const workSession = WorkSession.make(makeWorkSessionArg);

    expect(workSession).toHaveProperty("id");
    expect(workSession.id).not.toBe(SAMPLE_WORK_SESSION.id);
  });

  it(`throws error workSession arg is not valid`, () => {
    const invalidArg = { ...SAMPLE_WORK_SESSION, ref: "why I'm alive?" };

    expect(() => {
      // @ts-expect-error
      WorkSession.make(invalidArg);
    }).toThrowError();
  });

  it(`returns a frozen object and doesn't modify the given arg`, () => {
    const workSession = WorkSession.make(SAMPLE_WORK_SESSION);

    expect(Object.isFrozen(workSession)).toBeTruthy();
    expect(workSession).not.toBe(SAMPLE_WORK_SESSION);

    expect(Object.isFrozen(workSession.ref)).toBeTruthy();
    expect(workSession.ref).not.toBe(SAMPLE_WORK_SESSION.ref);

    expect(Object.isFrozen(workSession.elapsedTime)).toBeTruthy();
    expect(Object.isFrozen(workSession.elapsedTime.byDate)).toBeTruthy();

    expect(workSession.elapsedTime).not.toBe(SAMPLE_WORK_SESSION.elapsedTime);
    expect(workSession.elapsedTime.byDate).not.toBe(
      SAMPLE_WORK_SESSION.elapsedTime.byDate
    );

    expect(Object.isFrozen(workSession.events)).toBeTruthy();
    expect(workSession.events).not.toBe(SAMPLE_WORK_SESSION.events);

    for (let i = 0; i < workSession.events.length; i++) {
      expect(Object.isFrozen(workSession.events[i])).toBeTruthy();
      expect(workSession.events[i]).not.toBe(SAMPLE_WORK_SESSION.events[i]);
    }

    // after writing everything above in this test, I feel like a crazy person
    // What's wrong with me?
  });
});
