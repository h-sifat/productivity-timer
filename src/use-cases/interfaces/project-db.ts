import type { ProjectFields } from "entities/project/project";

export default interface ProjectDatabase {
  updateById(arg: {
    id: string;
    projectInfo: Omit<ProjectFields, "id">;
  }): Promise<ProjectFields>;
  findAll(): Promise<ProjectFields[]>;
  deleteById(arg: { id: string }): Promise<ProjectFields>;
  findById(arg: { id: string }): Promise<ProjectFields | null>;
  findByName(arg: { name: string }): Promise<ProjectFields | null>;
  insert(arg: { projectInfo: ProjectFields }): Promise<ProjectFields>;
}
