import type { MetaInfoControllerInterface } from "./interface";
import type { MetaInfoServiceInterface } from "use-cases/interfaces/meta-service";

import { z } from "zod";
import { pick } from "common/util/other";
import { formatError } from "common/validator/zod";

const RequestBodySchema = z
  .object({
    changes: z.record(z.string(), z.any()),
  })
  .strict();

export interface makeMetaInfoPatchController_Argument {
  service: Pick<MetaInfoServiceInterface, "update">;
}
export function makeMetaInfoPatchController(
  builderArg: makeMetaInfoPatchController_Argument
): MetaInfoControllerInterface["patch"] {
  const { service } = builderArg;

  return async function metaInfoPatchController(request) {
    const validationResult = RequestBodySchema.safeParse(request.body);

    try {
      if (!validationResult.success)
        throw {
          code: "INVALID_REQUEST",
          message: formatError(validationResult.error),
        };

      const { changes } = validationResult.data;

      const updatedMetaInfo = await service.update({
        changes,
        audience: "public",
      });

      return { body: { success: true, data: updatedMetaInfo } };
    } catch (ex) {
      return { body: { success: false, error: pick(ex, ["message", "code"]) } };
    }
  };
}
