import {
  DEFAULT_DATA_DIR,
  DEFAULT_BACKUP_DIR,
  DEFAULT_MPLAYER_PATH,
  DEFAULT_BEEP_DURATION_MS,
  DEFAULT_TIMER_DURATION_MS,
  DEFAULT_DB_BACKUP_INTERVAL_MS,
} from ".";
import path from "path";
import { z } from "zod";
import { formatError } from "common/validator/zod";
import { MS_IN_ONE_MINUTE, parseDuration } from "common/util/date-time";

const makeDurationSchema = (arg: { minValue: number }) =>
  z.preprocess((duration) => {
    if (typeof duration === "string")
      try {
        return parseDuration(duration);
      } catch {
        return duration;
      }
    else return duration;
  }, z.number().int().positive().gte(arg.minValue));

const ConfigFileSchema = z
  .object({
    DATA_DIR: z
      .string()
      .min(1)
      .default(DEFAULT_DATA_DIR)
      .transform((dir) => path.resolve(dir)),
    DB_BACKUP_DIR: z
      .string()
      .min(1)
      .default(DEFAULT_BACKUP_DIR)
      .transform((dir) => path.resolve(dir)),

    MPLAYER_PATH: z.string().min(1).default(DEFAULT_MPLAYER_PATH),
    SHOW_TIMER_NOTIFICATIONS: z.boolean().default(true),

    BEEP_DURATION_MS: makeDurationSchema({ minValue: 5000 }).default(
      DEFAULT_BEEP_DURATION_MS
    ),

    DEFAULT_TIMER_DURATION_MS: makeDurationSchema({ minValue: 5000 })
      .refine((value) => value % 1000 === 0, {
        message: `"DEFAULT_TIMER_DURATION_MS" must be a multiple of 1000 (1 second)`,
      })
      .default(DEFAULT_TIMER_DURATION_MS),

    DB_BACKUP_INTERVAL_MS: makeDurationSchema({
      minValue: MS_IN_ONE_MINUTE * 5,
    }).default(DEFAULT_DB_BACKUP_INTERVAL_MS),
  })
  .strict();

export type FileConfigInterface = z.infer<typeof ConfigFileSchema>;

export function validateFileConfig(config: any) {
  const result = ConfigFileSchema.safeParse(config);

  if (!result.success) throw new Error(formatError(result.error));
  return result.data;
}
