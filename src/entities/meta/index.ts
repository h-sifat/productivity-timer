import { z } from "zod";
import EPP from "common/util/epp";
import { createMD5Hash } from "common/util/other";
import { formatError } from "common/validator/zod";
import { convertDuration } from "common/util/date-time";

export interface PrivateMetaInfoInterface {
  lastBackupTime: number | null;
}

export interface PublicMetaInfoInterface {
  dailyWorkTargetMs: number | null;
}

export type MetaInformationInterface = PrivateMetaInfoInterface &
  PublicMetaInfoInterface;

export const DEFAULT_META_INFO = Object.freeze({
  lastBackupTime: null,
  dailyWorkTargetMs: null,
});

const MS_IN_ONE_MINUTE = convertDuration({
  duration: 1,
  toUnit: "ms",
  fromUnit: "minute",
});

export const MIN_DAILY_WORK_TARGET_MS = MS_IN_ONE_MINUTE * 5;

export const PublicMetaFields: (keyof PublicMetaInfoInterface)[] =
  Object.freeze(["dailyWorkTargetMs"]) as any;

const PublicMetaInfoSchema = z
  .object({
    dailyWorkTargetMs: z
      .union([
        z.number().positive().int().gte(MIN_DAILY_WORK_TARGET_MS, {
          message: `Come on! You can work way more than this.`,
        }),
        z.null(),
      ])
      .default(null),
  })
  .strict();

const PrivateMetaInfoSchema = z
  .object({
    lastBackupTime: z
      .union([z.number().positive().int(), z.null()])
      .default(null),
  })
  .strict();

const MetaInformationSchema = PublicMetaInfoSchema.merge(
  PrivateMetaInfoSchema
).strict();

export type editMetaInfo_Arg = { metaInfo: MetaInformationInterface } & (
  | { audience: "public"; changes: Partial<PublicMetaInfoInterface> }
  | { audience: "private"; changes: Partial<PrivateMetaInfoInterface> }
);

const editChangesSchemas = Object.freeze({
  public: PublicMetaInfoSchema.partial(),
  private: MetaInformationSchema.partial(),
});

export function editMetaInfo(arg: editMetaInfo_Arg) {
  const { audience, changes } = arg;
  const changesSchema = editChangesSchemas[audience];

  const validationResult = changesSchema.safeParse(changes);
  if (!validationResult.success)
    throw new EPP({
      code: "INVALID_CHANGES",
      message: formatError(validationResult.error),
    });

  return Object.freeze({ ...arg.metaInfo, ...validationResult.data });
}

export function validateMetaInformation(
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
  const serialized = Object.entries(metaInfo)
    .sort(([kA], [kB]) => kA.localeCompare(kB))
    .map(([k, v]) => k + String(v))
    .join("");

  return createMD5Hash(serialized);
}
