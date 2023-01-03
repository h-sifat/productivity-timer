import { pick } from "common/util/other";
import type { MetaInfoControllerInterface } from "./interface";
import type { MetaInfoServiceInterface } from "use-cases/interfaces/meta-service";

export interface makeGetController_Argument {
  service: Pick<MetaInfoServiceInterface, "get">;
}
export function makeGetController(
  arg: makeGetController_Argument
): MetaInfoControllerInterface["get"] {
  const { service } = arg;

  return async function get() {
    try {
      const metaInfo = await service.get({ audience: "public" });
      return { body: { success: true, data: metaInfo } };
    } catch (ex) {
      return { body: { success: false, error: pick(ex, ["message", "code"]) } };
    }
  };
}
