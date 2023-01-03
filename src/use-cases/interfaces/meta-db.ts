import type { MetaInformationInterface } from "entities/meta";

export interface MetaInformationDatabaseInterface {
  get(): Promise<MetaInformationInterface>;
  set(metaInfo: MetaInformationInterface): Promise<void>;
}
