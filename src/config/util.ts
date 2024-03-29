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
import { DAY_NAMES_LOWERCASE_TRIPLET_ARRAY } from "tui/components/calendar/util";

const ALL_DAY_NAMES_LOWERCASE = Object.freeze(
  DAY_NAMES_LOWERCASE_TRIPLET_ARRAY.flat()
);

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
    MPLAYER_AUDIO_PATH: z.string().min(1).optional(),
    SPEAKER_VOLUME: z.number().int().gte(0).lte(100).default(80),

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

    FIRST_DAY_OF_WEEK: z
      .string()
      .trim()
      .transform((name) => name.toLowerCase())
      .refine(
        (dayName) => ALL_DAY_NAMES_LOWERCASE.includes(dayName),
        (dayName) => ({ message: `Invalid day name: "${dayName}"` })
      )
      .default("Sat"),

    AUTO_START_BREAK: z.boolean().default(false),
    AUTO_START_BREAK_DURATION: makeDurationSchema({
      minValue: MS_IN_ONE_MINUTE * 1,
    }).default(MS_IN_ONE_MINUTE * 5),

    CHECK_UPDATE: z.boolean().default(true),
  })
  .strict();

export type FileConfigInterface = z.infer<typeof ConfigFileSchema>;

export function validateFileConfig(config: any) {
  const result = ConfigFileSchema.safeParse(config);

  if (!result.success) throw new Error(formatError(result.error));
  return result.data;
}
