import required from "common/util/required";

it('throws an error with the error code "MISSING_PROPERTY"', () => {
  expect(() => {
    required("propName");
  }).toThrowErrorWithCode("MISSING_PROPERTY");
});
