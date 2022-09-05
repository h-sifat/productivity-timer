import required from "common/util/required";

it('throws an error with the error code "MISSING_PROPERTY"', () => {
  expect(() => {
    required("propName");
  }).toThrowErrorWithCode("MISSING_PROPERTY");
});

it("throws error with the provided error code", () => {
  const CUSTOM_ERROR_CODE = "YOU_IDIOT";
  expect(() => {
    required("propName", CUSTOM_ERROR_CODE);
  }).toThrowErrorWithCode(CUSTOM_ERROR_CODE);
});
