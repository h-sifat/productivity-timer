import { validateMetaInformation } from "entities/meta";

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
        validateMetaInformation(metaInfo, hash);
      } catch (ex) {
        expect(ex.code).toBe(errorCode);
      }
    }
  );
});
