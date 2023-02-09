import { z } from "zod";
import EPP from "common/util/epp";
import { formatError } from "common/validator/zod";

const StaticsSchema = z.array(
  z
    .object({
      date: z.number().int().nonnegative(),
      totalDurationMs: z.number().int().nonnegative(),
      durationPerRefs: z.array(
        z
          .object({
            duration: z.number().int().nonnegative(),
            ref: z
              .object({
                id: z.string().min(1),
                type: z.union([z.literal("category"), z.literal("project")]),
              })
              .strict(),
          })
          .strict()
      ),
    })
    .strict()
);

export function validateDailyStat(stat: any) {
  try {
    return StaticsSchema.parse(stat);
  } catch (ex) {
    throw new EPP({ code: "INVALID_STAT", message: formatError(ex) });
  }
}
