import { z } from "zod";
import EPP from "common/util/epp";
import { createMD5Hash } from "common/util/other";
import { formatError } from "common/validator/zod";

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

export const PublicMetaFields: readonly (keyof PublicMetaInfoInterface)[] =
  Object.freeze(["dailyWorkTargetMs"]);

const MetaInformationSchema = z
  .object({
    lastBackupTime: z
      .union([z.number().positive().int(), z.null()])
      .default(null),
    dailyWorkTargetMs: z
      .union([z.number().positive().int(), z.null()])
      .default(null),
  })
  .strict();

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
