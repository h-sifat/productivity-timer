import type { Writable } from "type-fest";
import type { ProjectFields } from "entities/project/project";
import type { CategoryFields } from "entities/category/category";

export interface IdToIndexMap {
  [id: string]: number;
}

export type ProjectInterface = Writable<ProjectFields>;
export type CategoryInterface = Writable<CategoryFields>;

export type ResourceStatus = "idle" | "loading" | "loaded" | "error";
export type ErrorMessageAndCode = { message: string; code?: string };

export interface ProjectState {
  status: ResourceStatus;
  idToIndexMap: IdToIndexMap;
  projectsArray: ProjectFields[];
  error: ErrorMessageAndCode | null;
}

export interface CategoryState {
  status: ResourceStatus;
  idToIndexMap: IdToIndexMap;
  categoriesArray: CategoryFields[];
  error: ErrorMessageAndCode | null;
}
