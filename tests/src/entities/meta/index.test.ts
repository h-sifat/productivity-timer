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
      hash: "invalid-hash",
      case: "hash doesn't match",
      metaInfo: DEFAULT_META_INFO,
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
        audience: "private",
        metaInfo: DEFAULT_META_INFO,
        changes: { lastBackupTime: -142423.2432 },
        case: "changes contains invalid props",
      },
      {
        audience: "public",
        metaInfo: DEFAULT_META_INFO,
        changes: { unknown: 23423 },
        case: "changes contains unknown props",
      },
    ] as const)(
      `throws ewc "${errorCode}" if $case | audience: $audience`,
      ({ changes, audience, metaInfo }) => {
        expect.assertions(1);

        try {
          MetaInformation.edit({ audience, changes, metaInfo } as any);
        } catch (ex) {
          expect(ex.code).toBe(errorCode);
        }
      }
    );
  });

  describe("Functionality", () => {
    const metaInfo = DEFAULT_META_INFO;

    it.each([
      {
        metaInfo,
        audience: "private",
        changes: { lastBackupTime: 123 },
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
