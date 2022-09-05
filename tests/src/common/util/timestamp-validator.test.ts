import makeTimestampsFixture from "fixtures/timestamps";
import { isValidUnixMsTimestamp } from "common/util/date-time";
import makeTimestampsValidator from "common/util/timestamp-validator";

const timestampsFixture = makeTimestampsFixture({
  creationTimestampPropName: "createdOn",
  modificationTimestampPropName: "modifiedOn",
});

const validateTimestamps = makeTimestampsValidator({
  isValidTimestamp: isValidUnixMsTimestamp,
  getNewTimestamp: jest.fn().mockReturnValue(100),
});

describe("field:createdOn and modifiedOn", () => {
  it.each([
    { property: "createdOn", errorCode: "INVALID_CREATION_TIMESTAMP" },
    { property: "modifiedOn", errorCode: "INVALID_MODIFICATION_TIMESTAMP" },
  ])(
    `throws error with code "$errorCode" if "$property" is invalid`,
    ({ property, errorCode }) => {
      const invalidTimestamp = -2323;

      expect(isValidUnixMsTimestamp(invalidTimestamp)).toBeFalsy();

      const objectContainingTimestamps = timestampsFixture({
        [property]: invalidTimestamp,
      });

      expect(() => {
        validateTimestamps({ objectContainingTimestamps });
      }).toThrowErrorWithCode(errorCode);
    }
  );

  it("throws error if the modifiedOn timestamp is less than createdOn timestamp", () => {
    const objectContainingTimestamps = timestampsFixture({
      createdOn: 2,
      modifiedOn: 1,
    });

    expect(() => {
      validateTimestamps({ objectContainingTimestamps });
    }).toThrowErrorWithCode("MODIFIED_BEFORE_CREATED");
  });

  {
    const argMissingModificationTimestamp = timestampsFixture();
    // @ts-expect-error
    delete argMissingModificationTimestamp.modifiedOn;

    const argMissingCreationTimestamp = timestampsFixture();
    // @ts-expect-error
    delete argMissingCreationTimestamp.createdOn;

    it.each([argMissingCreationTimestamp, argMissingModificationTimestamp])(
      `throws error with code "MISSING_ANOTHER_TIMESTAMP" if only one timestamp is provided`,
      (arg) => {
        expect(() => {
          validateTimestamps({ objectContainingTimestamps: arg });
        }).toThrowErrorWithCode("MISSING_ANOTHER_TIMESTAMP");
      }
    );
  }

  it("creation and modifiedOn should be same if they are not provided", () => {
    const timestamps = validateTimestamps({ objectContainingTimestamps: {} });

    expect(timestamps.createdOn).toBe(timestamps.modifiedOn);
    expect(isValidUnixMsTimestamp(timestamps.createdOn)).toBeTruthy();
  });
});
