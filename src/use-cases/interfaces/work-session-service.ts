import type { QueryMethodArguments } from "./work-session-db";
import type WorkSessionDatabaseInterface from "./work-session-db";
import type { DeepFreezeTypeMapper } from "common/interfaces/other";
import type { TimerRefWithName } from "src/controllers/timer/interface";
import type { WorkSessionFields } from "entities/work-session/work-session";

interface AddWorkSession_Argument {
  workSessionInfo: Omit<QueryMethodArguments["insert"], "id">;
}

export type WorkSessionServiceInterface = {
  getMaxId(): Promise<number>;
  addWorkSession(
    arg: AddWorkSession_Argument
  ): Promise<DeepFreezeTypeMapper<WorkSessionFields>>;
  listWorkSessionsByDateRange(arg: {
    from: string;
    to?: string;
  }): Promise<WorkSessionFields<TimerRefWithName>[]>;
} & Pick<WorkSessionDatabaseInterface, "getStats">;
