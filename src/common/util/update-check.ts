import checkForUpdate from "update-check";
import { convertDuration } from "./date-time";
import packageDotJson from "../../../package.json";
import type { Notify } from "common/interfaces/other";

interface showUpdateNotification_Arg {
  notify: Notify;
  retry?: boolean;
  retryInterval?: number;
  /**
   * A wrapper for setTimeout. Only meant for testing. Don't provide this
   * property when calling this function.
   * */
  scheduleTask?: typeof setTimeout;
  /**
   * A wrapper for checkForUpdate from "update-check". Only meant for testing.
   * Don't provide this property when calling this function.
   * */
  checkUpdate?: typeof checkForUpdate;
}
export async function showUpdateNotification(arg: showUpdateNotification_Arg) {
  const { notify, checkUpdate = checkForUpdate } = arg;

  try {
    const update = await checkUpdate(packageDotJson);

    if (update?.latest)
      notify(
        `An update (v${update.latest}) is available. Please consider updating.`
      );
  } catch (ex) {
    const { retry = false } = arg;
    if (!retry) return;

    const retryInterval =
      arg.retryInterval ||
      convertDuration({
        fromUnit: "minute",
        toUnit: "millisecond",
        duration: Math.floor(Math.random() * 100 + 5),
      });

    const { scheduleTask = setTimeout } = arg;

    scheduleTask(showUpdateNotification, retryInterval, {
      notify,
      retry: false,
    });
  }
}
