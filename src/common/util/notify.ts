import { Notify } from "common/interfaces/other";
import { notify as __notify__ } from "node-notifier";

export interface makeNotify_Argument {
  icon: string;
  title: string;
}

export function makeNotify(arg: makeNotify_Argument): Notify {
  const { icon, title } = arg;
  return (message) => __notify__({ title, icon, message });
}
