import { convertDuration } from "common/util/date-time";
import { DEFAULT_META_INFO, MetaInformation } from "entities/meta";

describe("ValidateMetaInformation", () => {
  it.each([
    {
      hash: undefined,
      case: "contains unknown props",
      errorCode: "INVALID_META_INFO",
      metaInfo: { unknownProps: "hi" },
    },
    {
      metaInfo: {},
      hash: "invalid-hash",
      case: "hash doesn't match",
      errorCode: "INVALID_META_INFO:INVALID_HASH",
    },
  ])(
    `throws ewc "$errorCode" if metaInfo $case`,
    ({ metaInfo, hash, errorCode }) => {
      expect.assertions(1);
      try {
        MetaInformation.validate(metaInfo, hash);
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }
    }
  );
});

describe("editMetaInfo", () => {
  describe("Validation", () => {
    const errorCode = "INVALID_CHANGES";
    it.each([
      {
        audience: "public",
        metaInfo: DEFAULT_META_INFO,
        changes: { dailyWorkTargetMs: -1 },
        case: "changes contains invalid props",
      },
      {
        audience: "private",
        metaInfo: DEFAULT_META_INFO,
        changes: { dailyWorkTargetMs: -1 },
        case: "changes contains invalid props",
      },
      {
        audience: "public",
        metaInfo: DEFAULT_META_INFO,
        changes: { lastBackupTime: 23423 },
        case: "changes contains unknown props",
      },
      {
        audience: "public",
        metaInfo: DEFAULT_META_INFO,
        changes: { unknown: "hi" },
        case: "changes contains unknown props",
      },
      {
        audience: "public",
        metaInfo: DEFAULT_META_INFO,
        changes: { firstDayOfWeek: "Bla" },
        case: "changes contains invalid firstDayOfWeek",
      },
    ] as const)(
      `throws ewc "${errorCode}" if $case | audience: $audience`,
      ({ changes, audience, metaInfo }) => {
        expect.assertions(1);

        try {
          MetaInformation.edit({ audience, changes, metaInfo });
        } catch (ex) {
          expect(ex.code).toBe(errorCode);
        }
      }
    );
  });

  describe("Functionality", () => {
    const metaInfo = DEFAULT_META_INFO;
    const MS_IN_ONE_HOUR = convertDuration({
      fromUnit: "h",
      toUnit: "ms",
      duration: 1,
    });

    it.each([
      {
        metaInfo,
        audience: "private",
        changes: { lastBackupTime: 123, dailyWorkTargetMs: MS_IN_ONE_HOUR * 6 },
      },
      {
        metaInfo,
        audience: "public",
        changes: {
          firstDayOfWeek: "Sun",
          dailyWorkTargetMs: MS_IN_ONE_HOUR * 6,
        },
      },
    ] as const)(
      `it edits the metaInfo | audience: $audience`,
      ({ changes, audience, metaInfo }) => {
        const edited = MetaInformation.edit({ audience, changes, metaInfo });
        expect(edited).toEqual({ ...metaInfo, ...changes });
      }
    );
  });
});
