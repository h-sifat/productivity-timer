import type { Server } from "express-ipc";
import type { TimerInstance } from "src/countdown-timer/type";
import type { TimerRefWithName } from "src/controllers/timer/interface";

export interface makeCategoryAndProjectDeleteSideEffect_Argument {
  server: Server;
  broadcastChannel: string;
  documentType: TimerRefWithName["type"];
  timer: Pick<
    TimerInstance<TimerRefWithName>,
    "ref" | "reset" | "deletePreviousNonNullRef" | "previousNonNullRef"
  >;
}
export function makeDocumentDeleteSideEffect(
  factoryArg: makeCategoryAndProjectDeleteSideEffect_Argument
): (arg: { deleted: { id: string }[] }) => Promise<void> {
  const { timer, documentType, server, broadcastChannel } = factoryArg;

  return async function categoryDeleteSideEffect(arg) {
    const { deleted } = arg;

    server.broadcast({
      channel: broadcastChannel,
      data: { event: "delete", data: deleted },
    });

    if (timer.ref && timer.ref.type === documentType) {
      const refId = timer.ref.id;

      for (const document of deleted)
        if (document.id === refId) {
          timer.reset();
          timer.deletePreviousNonNullRef();
          break;
        }
    }

    if (
      timer.previousNonNullRef &&
      timer.previousNonNullRef.type === documentType
    ) {
      const refId = timer.previousNonNullRef.id;
      for (const document of deleted)
        if (document.id === refId) {
          timer.deletePreviousNonNullRef();
          break;
        }
    }
  };
}
