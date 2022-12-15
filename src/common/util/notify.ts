import { notify as __notify__ } from "node-notifier";

export interface notify_Argument {
  title: string;
  message: string;
}

export function notify(arg: notify_Argument) {
  const { title, message } = arg;
  __notify__({ title, message });
}
