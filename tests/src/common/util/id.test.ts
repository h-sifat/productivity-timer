import { isValid } from "common/util/id";

describe("Id.isValid", () => {
  it.each([
    {
      id: ["not_a_string"],
      case: "not a non_empty_string",
      isIdValid: false,
    },
    {
      id: "",
      case: "not a non_empty_string",
      isIdValid: false,
    },
    {
      id: "non_numeric_str",
      case: "not a numeric string",
      isIdValid: false,
    },
    {
      id: "-234",
      case: "not a positive_integer string",
      isIdValid: false,
    },
    {
      id: "-23.4",
      case: "not a positive_integer string",
      isIdValid: false,
    },
    {
      id: "0",
      case: "not a positive_integer string",
      isIdValid: false,
    },
    {
      id: "1",
      case: "a positive_integer string",
      isIdValid: true,
    },
  ])(`returns $isIdValid if id($id) is $case`, ({ id, isIdValid }) => {
    // @ts-ignore
    expect(isValid(id)).toBe(isIdValid);
  });
});
