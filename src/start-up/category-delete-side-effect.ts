import type { TimerInstance } from "src/countdown-timer/type";
import type { TimerRefWithName } from "src/controllers/timer/interface";

export interface makeCategoryAndProjectDeleteSideEffect_Argument {
  documentType: TimerRefWithName["type"];
  timer: Pick<TimerInstance<TimerRefWithName>, "ref" | "reset">;
}
export function makeDocumentDeleteSideEffect(
  factoryArg: makeCategoryAndProjectDeleteSideEffect_Argument
): (arg: { deleted: { id: string }[] }) => Promise<void> {
  const { timer, documentType } = factoryArg;

  return async function categoryDeleteSideEffect(arg) {
    if (!timer.ref || timer.ref.type !== documentType) return;

    const refId = timer.ref.id;

    const { deleted } = arg;
    for (const document of deleted)
      if (document.id === refId) {
        timer.reset();
        break;
      }
  };
}
