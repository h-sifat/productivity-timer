import { DeepFreezeTypeMapper } from "common/interfaces/other";
import { WorkSessionFields } from "entities/work-session/work-session";

export interface QueryMethodArguments {
  insert: WorkSessionFields | DeepFreezeTypeMapper<WorkSessionFields>;
  findByDateRange: { from: string; to?: string };
}

export default interface WorkSessionDatabaseInterface {
  findByDateRange(
    arg: QueryMethodArguments["findByDateRange"]
  ): Promise<WorkSessionFields[]>;
  insert(arg: QueryMethodArguments["insert"]): Promise<void>;
}
