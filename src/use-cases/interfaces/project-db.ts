import type { ProjectFields } from "entities/project/project";

interface UpdateById_Argument {
  id: string;
  changes: Partial<ProjectFields>;
}

export default interface ProjectDatabaseInterface {
  findAll(): Promise<ProjectFields[]>;
  insert(arg: ProjectFields): Promise<ProjectFields>;
  deleteById(arg: { id: string }): Promise<ProjectFields>;
  findById(arg: { id: string }): Promise<ProjectFields | null>;
  updateById(arg: UpdateById_Argument): Promise<ProjectFields>;
  findByName(arg: { name: string }): Promise<ProjectFields | null>;
}
