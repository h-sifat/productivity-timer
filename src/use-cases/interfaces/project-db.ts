import type { ProjectFields } from "entities/project/project";

export default interface ProjectDatabase {
  findById(arg: { id: string }): Promise<ProjectFields | null>;
  findByName(arg: { name: string }): Promise<ProjectFields | null>;
  insert(arg: { projectInfo: ProjectFields }): Promise<ProjectFields>;
}
