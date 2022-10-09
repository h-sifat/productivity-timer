import type { ProjectFields } from "entities/project/project";

export interface QueryMethodArguments {
  insert: ProjectFields;
  findById: { id: string };
  deleteById: { id: string };
  findByName: { name: string };
  updateById: { id: string; edited: Partial<ProjectFields> };
}

export default interface ProjectDatabaseInterface {
  findByName(
    arg: QueryMethodArguments["findByName"]
  ): Promise<ProjectFields | null>;
  findById(
    arg: QueryMethodArguments["findById"]
  ): Promise<ProjectFields | null>;

  findAll(): Promise<ProjectFields[]>;
  insert(arg: QueryMethodArguments["insert"]): Promise<void>;
  updateById(arg: QueryMethodArguments["updateById"]): Promise<void>;
  deleteById(arg: QueryMethodArguments["deleteById"]): Promise<void>;
}
