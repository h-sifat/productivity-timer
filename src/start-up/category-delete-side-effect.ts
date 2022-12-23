import type { TimerInstance } from "src/countdown-timer/type";
import type { TimerRefWithName } from "src/controllers/timer/interface";
import type { CategoryDeleteSideEffect } from "use-cases/interfaces/category-service";

export interface makeCategoryDeleteSideEffect_Argument {
  timer: Pick<TimerInstance<TimerRefWithName>, "ref" | "reset">;
}
export function makeCategoryDeleteSideEffect(
  factoryArg: makeCategoryDeleteSideEffect_Argument
): CategoryDeleteSideEffect {
  const { timer } = factoryArg;

  return async function categoryDeleteSideEffect(arg) {
    if (!timer.ref || timer.ref.type !== "category") return;

    const refId = timer.ref.id;

    const { deleted } = arg;
    for (const category of deleted)
      if (category.id === refId) {
        timer.reset();
        break;
      }
  };
}
