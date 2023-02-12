import type {
  PublicMetaInfoInterface,
  MetaInformationInterface,
} from "entities/meta";

type Filter = {
  audience: "public" | "private";
};

export type UpdateArg =
  | { changes: Partial<PublicMetaInfoInterface>; audience: "public" }
  | { changes: Partial<MetaInformationInterface>; audience: "private" };

type ResponseType<T extends Filter> = T["audience"] extends "public"
  ? Promise<PublicMetaInfoInterface>
  : Promise<MetaInformationInterface>;

export type MetaInfoServiceInterface = {
  get<T extends Filter>(arg: T): ResponseType<T>;
  update<T extends UpdateArg>(arg: T): ResponseType<T>;
};

export type MetaInfoUpdateSideEffect = (
  metaInfo: PublicMetaInfoInterface
) => void;
