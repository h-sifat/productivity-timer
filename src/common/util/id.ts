import { ID } from "common/interfaces/id";
import { is } from "handy-types";

export const isValid: ID["isValid"] = function _isValid(id: string) {
  return (
    is<string>("non_empty_string", id) &&
    is<number>("positive_integer", Number(id))
  );
};
