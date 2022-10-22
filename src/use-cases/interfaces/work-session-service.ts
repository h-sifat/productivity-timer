import type { QueryMethodArguments } from "./work-session-db";
import type { DeepFreezeTypeMapper } from "common/interfaces/other";
import type { WorkSessionFields } from "entities/work-session/work-session";

export interface WorkSessionServiceInterface {
  getMaxId(): Promise<number>;
  addWorkSession(
    arg: QueryMethodArguments["insert"]
  ): Promise<DeepFreezeTypeMapper<WorkSessionFields>>;
  listWorkSessionsByDateRange(arg: {
    from: string;
    to?: string;
  }): Promise<WorkSessionFields[]>;
}
