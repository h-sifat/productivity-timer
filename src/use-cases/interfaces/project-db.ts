import type { ProjectFields } from "entities/project/project";

export default interface ProjectDatabaseInterface {
  updateById(arg: {
    id: string;
    changes: Partial<ProjectFields>;
  }): Promise<ProjectFields>;
  findAll(): Promise<ProjectFields[]>;
  deleteById(arg: { id: string }): Promise<ProjectFields>;
  findById(arg: { id: string }): Promise<ProjectFields | null>;
  findByName(arg: { name: string }): Promise<ProjectFields | null>;
  insert(arg: ProjectFields): Promise<ProjectFields>;
}
