import MockDb, { QueryExecutorMethodArg } from "fixtures/data-access/mock-db";
import type { ProjectFields, ProjectStatus } from "entities/project/project";
import ProjectDatabaseInterface from "use-cases/interfaces/project-db";
import EPP from "common/util/epp";
import { assert } from "handy-types";
import required from "common/util/required";

// @ts-ignore
export default class ProjectDatabase
  extends MockDb<string, ProjectFields>
  implements ProjectDatabaseInterface
{
  async findAll() {
    return await this.find();
  }

  async findByName(arg: { name: string }): Promise<ProjectFields | null> {
    let { name = required("name") } = arg;
    assert<string>("non_empty_string", name, {
      name: "Name",
      code: "INVALID_NAME",
    });

    name = name.toLowerCase();

    return this.enqueueQuery<ProjectFields | null>({
      arg: { name },
      method: "findByName",
    });
  }

  protected __findByName__(query: QueryExecutorMethodArg) {
    const { arg, resolve } = query;

    for (const existingDocument of this.__getAllDocuments__())
      if (existingDocument.name.toLowerCase() === arg.name)
        return resolve(existingDocument);

    resolve(null);
  }

  // whenever a document is stored in the db add it's caseInsensitiveName in an
  // index so that we can prevent inserts with duplicate name
  protected override __setDocument__(arg: {
    id: string;
    callee: string;
    document: ProjectFields;
    reject: (v: unknown) => void;
  }): Map<string, ProjectFields> {
    const { id, callee, document, reject } = arg;

    // for updateById and corruptById don't impose this restriction
    if (!["updateById", "corruptById"].includes(callee)) {
      const caseInsensitiveName = document.name.toLowerCase();

      for (const existingDocument of this.store.values())
        if (existingDocument.name.toLowerCase() === caseInsensitiveName) {
          const error = new EPP({
            code: "DUPLICATE_NAME",
            message: `A document with name: "${document.name}" (${caseInsensitiveName}) already exists.`,
          });
          reject(error);
          return this.store;
        }
    }

    return this.store.set(id, document);
  }
}
