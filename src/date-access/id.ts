import type { ID } from "common/interfaces/id";
import { isValid } from "common/util/id";

const currentIds = {
  category: 1,
};

interface getID_Argument {
  entity: "category";
}
export default function getID(arg: getID_Argument): ID {
  const { entity } = arg;

  return {
    isValid,
    makeId: () => {
      const nextId = ++currentIds[entity];
      return nextId.toString();
    },
  };
}
