import { inspect } from "util";
import required from "common/util/required";

const testData = [
  { args: ["age"], expectedErrorCode: "MISSING_AGE", argString: "" },
  {
    args: ["parentId", "MISSING_PARENT_ID"],
    expectedErrorCode: "MISSING_PARENT_ID",
    argString: "",
  },
  {
    args: ["parentId", { code: "MISSING_PARENT_ID" }],
    expectedErrorCode: "MISSING_PARENT_ID",
    argString: "",
  },
].map((test) => {
  test.argString = test.args.map((arg) => inspect(arg)).join(", ");
  return test;
});

it.concurrent.each(testData)(
  `required($argString) => throws ewc "$expectedErrorCode"`,
  ({ args, expectedErrorCode }) => {
    expect(() => {
      // @ts-ignore
      required(...args);
    }).toThrowErrorWithCode(expectedErrorCode);
  }
);

it(`adds the objectName in the error message if provided`, () => {
  expect(() => {
    required("name", { objectName: "user" });
  }).toThrowError(/user/);
});
