import type { QueryMethodArguments } from "./work-session-db";
import type { DeepFreezeTypeMapper } from "common/interfaces/other";
import type { WorkSessionFields } from "entities/work-session/work-session";

interface AddWorkSession_Argument {
  workSessionInfo: Omit<QueryMethodArguments["insert"], "id">;
}

export interface WorkSessionServiceInterface {
  getMaxId(): Promise<number>;
  addWorkSession(
    arg: AddWorkSession_Argument
  ): Promise<DeepFreezeTypeMapper<WorkSessionFields>>;
  listWorkSessionsByDateRange(arg: {
    from: string;
    to?: string;
  }): Promise<WorkSessionFields[]>;
}
