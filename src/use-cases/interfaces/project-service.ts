import type {
  Edit_Argument,
  ProjectFields,
  MakeProject_Argument,
} from "entities/project/project";
import type { QueryMethodArguments } from "./project-db";
import ProjectDatabaseInterface from "./project-db";

export interface AddProject_Argument {
  projectInfo: MakeProject_Argument;
}
export interface EditProject_Argument {
  id: string;
  changes: Edit_Argument["changes"];
}

export interface ProjectServiceInterface {
  getMaxId(): Promise<number>;
  listProjects(): Promise<ProjectFields[]>;
  editProject(arg: EditProject_Argument): Promise<ProjectFields>;
  addProject(arg: AddProject_Argument): Promise<Readonly<ProjectFields>>;
  getProjectById(
    arg: QueryMethodArguments["findById"]
  ): Promise<ProjectFields | null>;
  removeProject(
    arg: QueryMethodArguments["deleteById"]
  ): Promise<ProjectFields>;
  findByName: ProjectDatabaseInterface["findByName"];
}

export type ProjectDeleteSideEffect = (arg: {
  id: string;
  deleted: ProjectFields[];
}) => Promise<void>;

export type ProjectAddSideEffect = (project: ProjectFields) => void;
export type ProjectEditSideEffect = (arg: {
  original: ProjectFields;
  updated: ProjectFields;
}) => void;
