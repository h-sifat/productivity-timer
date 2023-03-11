export const CLI_NAME = "pt";

export const BROADCAST_CHANNELS = {
  TIMER_BROADCAST_CHANNEL: "timer",
  PROJECT_BROADCAST_CHANNEL: "project",
  CATEGORY_BROADCAST_CHANNEL: "category",
  META_INFO_BROADCAST_CHANNEL: "meta-info",
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
  SERVER_NAMESPACE:
    __BUILD_MODE__ === "production" ? "pt_by_sifat" : "pt_by_sifat_dev",
  SERVER_ID: "v" + __APP_VERSION__,
};
