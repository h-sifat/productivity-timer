import { assert } from "handy-types";
import type ProjectDatabaseInterface from "use-cases/interfaces/project-db";
import type { ProjectServiceInterface } from "use-cases/interfaces/project-service";

export interface makeFindByName_Argument {
  database: Pick<ProjectDatabaseInterface, "findByName">;
}
export function makeFindByName(
  factoryArg: makeFindByName_Argument
): ProjectServiceInterface["findByName"] {
  const { database } = factoryArg;
  return async function findByName(arg) {
    const name = String(arg.name).trim();
    assert<string>("non_empty_string", name, {
      name: "name",
      code: "INVALID_NAME",
    });

    return database.findByName({ name });
  };
}
