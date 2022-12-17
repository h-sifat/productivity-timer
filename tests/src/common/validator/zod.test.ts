import { formatError } from "common/validator/zod";

describe("formatError", () => {
  const makeFakeZodError = (flattenedError: any) => ({
    flatten() {
      return flattenedError;
    },
  });

  it.each([
    {
      case: `the first error from "formErrors" if it's non-empty`,
      expectedErrorMessage: "a",
      error: makeFakeZodError({ formErrors: ["a"], fieldErrors: { a: ["b"] } }),
    },
    {
      case: `returns a field error if formErrors array is empty`,
      expectedErrorMessage: "a: b",
      error: makeFakeZodError({ formErrors: [], fieldErrors: { a: ["b"] } }),
    },
    {
      case: `returns "Unknown error." if both formErrors and fieldErrors are empty`,
      expectedErrorMessage: "Unknown error.",
      error: makeFakeZodError({ formErrors: [], fieldErrors: {} }),
    },
  ])(`return $case`, ({ error, expectedErrorMessage }) => {
    const formatted = formatError(error as any);
    expect(formatted).toBe(expectedErrorMessage);
  });
});
