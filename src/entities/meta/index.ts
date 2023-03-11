import { z } from "zod";
import EPP from "common/util/epp";
import { formatError } from "common/validator/zod";
import { hashObject } from "common/util/hash-object";

export interface PrivateMetaInfoInterface {
  lastBackupTime: number | null;
}

export interface PublicMetaInfoInterface {
  version: string;
}

export type MetaInformationInterface = PrivateMetaInfoInterface &
  PublicMetaInfoInterface;

export type editMetaInfo_Arg = { metaInfo: MetaInformationInterface } & (
  | { audience: "public"; changes: Partial<PublicMetaInfoInterface> }
  | { audience: "private"; changes: Partial<PrivateMetaInfoInterface> }
);

export interface MetaInformationEntity {
  edit(arg: editMetaInfo_Arg): MetaInformationInterface;
  validate(
    metaInfo: unknown,
    hash?: string
  ): asserts metaInfo is MetaInformationInterface;
}

export const DEFAULT_META_INFO = Object.freeze({
  lastBackupTime: null,
  version: __APP_VERSION__,
});

export const PublicMetaFields: (keyof PublicMetaInfoInterface)[] =
  Object.freeze([]) as any;

const PublicMetaInfoSchema = z.object({}).strict();

const PrivateMetaInfoSchema = z
  .object({
    lastBackupTime: z
      .union([z.number().positive().int(), z.null()])
      .default(null),
    version: z.literal(__APP_VERSION__),
  })
  .strict();

let MetaInformationSchema = PublicMetaInfoSchema.merge(
  PrivateMetaInfoSchema
).strict();

const editChangesSchemas = Object.freeze({
  public: PublicMetaInfoSchema.partial(),
  private: MetaInformationSchema.partial(),
});

function editMetaInfo(arg: editMetaInfo_Arg): MetaInformationInterface {
  const { audience, changes } = arg;
  const changesSchema = editChangesSchemas[audience];

  const validationResult = changesSchema.safeParse(changes);
  if (!validationResult.success)
    throw new EPP({
      code: "INVALID_CHANGES",
      message: formatError(validationResult.error),
    });

  const edited = { ...arg.metaInfo };
  for (const [key, value] of Object.entries(validationResult.data))
    if (value !== undefined) (<any>edited)[key] = value;

  return Object.freeze(edited);
}

function validateMetaInformation(
  metaInfo: unknown,
  hash?: string
): asserts metaInfo is MetaInformationInterface {
  const result = MetaInformationSchema.safeParse(metaInfo);
  if (!result.success)
    throw new EPP({
      code: "INVALID_META_INFO",
      message: formatError(result.error),
    });

  if (
    typeof hash === "string" &&
    hash !== generateMetaInfoHash(metaInfo as any)
  )
    throw new EPP({
      code: "INVALID_META_INFO:INVALID_HASH",
      message: `The metaInfo object is invalid because the hash doesn't match.`,
    });
}

export function generateMetaInfoHash(metaInfo: MetaInformationInterface) {
  return hashObject(metaInfo);
}

export const MetaInformation: MetaInformationEntity = Object.freeze({
  edit: editMetaInfo,
  validate: validateMetaInformation,
});
