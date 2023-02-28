import type { ReadonlyDeep, Writable } from "type-fest";
import type { PublicMetaInfoInterface } from "entities/meta";
import type { ProjectFields } from "entities/project/project";
import type { CategoryFields } from "entities/category/category";
import type { DailyStat } from "use-cases/interfaces/work-session-db";
import type { TimerRefWithName } from "src/controllers/timer/interface";
import type { WorkSessionFields } from "entities/work-session/work-session";

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

export interface MetaInfoState {
  status: ResourceStatus;
  error: ErrorMessageAndCode | null;
  metaInfo: PublicMetaInfoInterface | null;
}

export interface ShortStats {
  [date: string]: DailyStat;
}

export interface StatsState {
  status: ResourceStatus;
  error: ErrorMessageAndCode | null;
  shortStatOfAllDays: ShortStats;
  workSessionsPerDate: {
    [date: string]: {
      fetchTimestamp: number;
      workSessions: ReadonlyDeep<WorkSessionFields<TimerRefWithName>[]>;
    };
  };
}
