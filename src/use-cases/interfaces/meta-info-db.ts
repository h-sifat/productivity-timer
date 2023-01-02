import type { MetaInformationInterface } from "entities/meta-info";

export interface MetaInformationDatabaseInterface {
  get(): Promise<MetaInformationInterface>;
  set(metaInfo: MetaInformationInterface): Promise<void>;
}
