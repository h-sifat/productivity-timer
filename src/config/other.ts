export const CLI_NAME = "pt";

let appVersion = "0.0.0_default";

try {
  // as this __APP_VERSION__ is provided by webpack at bundle time, I'm having
  // issues testing other codes that rely on this module.

  // @ts-ignore
  appVersion = __APP_VERSION__;
} catch {}

export const BROADCAST_CHANNELS = {
  TIMER_BROADCAST_CHANNEL: "timer",
  PROJECT_BROADCAST_CHANNEL: "project",
  CATEGORY_BROADCAST_CHANNEL: "category",
};

export const API_AND_SERVER_CONFIG = {
  API_APP_PATH: "/app",
  API_TIMER_PATH: "/timer",
  API_PROJECT_PATH: "/project",
  API_CATEGORY_PATH: "/category",
  API_META_INFO_PATH: "/meta-info",
  API_WORK_SESSION_PATH: "/work-session",

  ...BROADCAST_CHANNELS,

  // server
  SERVER_NAMESPACE: "pt_by_sifat",
  SERVER_ID: "v" + appVersion,
};
