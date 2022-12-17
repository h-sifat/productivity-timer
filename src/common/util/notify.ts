import { Notify } from "common/interfaces/other";
import { notify as __notify__ } from "node-notifier";

export const notify: Notify = function _notify(arg) {
  const { title, message } = arg;
  __notify__({ title, message });
};
