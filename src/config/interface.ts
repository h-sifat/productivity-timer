export interface ConfigInterface {
  [key: string]: any;
  // category
  CATEGORY_MAX_NAME_LENGTH: number;
  CATEGORY_VALID_NAME_PATTERN: RegExp;
  CATEGORY_MAX_DESCRIPTION_LENGTH: number;
  CATEGORY_MSG_NAME_DOES_NOT_MATCH_PATTERN: string;

  // project
  PROJECT_MAX_NAME_LENGTH: number;
  PROJECT_VALID_NAME_PATTERN: RegExp;
  PROJECT_MAX_DESCRIPTION_LENGTH: number;
  PROJECT_MIN_HOUR_BEFORE_DEADLINE: number;
  PROJECT_MSG_NAME_DOES_NOT_MATCH_PATTERN: string;

  // work session
  WORK_SESSION_MAX_ALLOWED_ELAPSED_TIME_DIFF: number;

  // db
  DB_PATH: string;
  DATA_DIR: string;
  DB_FILE_NAME: string;
  DB_BACKUP_DIR: string;
  LOG_FILE_NAME: string;
  CONFIG_FILE_PATH: string;
  DB_BACKUP_FILE_NAME: string;
  DB_BACKUP_INTERVAL_MS: number;
  DB_BACKUP_TEMP_FILE_NAME: string;
  DB_SUB_PROCESS_MODULE_PATH: string;
  DB_CLOSE_TIMEOUT_WHEN_KILLING: number;

  // speaker
  MPLAYER_PATH: string;
  SPEAKER_VOLUME: number;
  BEEP_DURATION_MS: number;
  MPLAYER_AUDIO_PATH: string;

  // other
  NOTIFICATION_TITLE: string;
  FIRST_DAY_OF_WEEK: string;

  // server
  API_APP_PATH: string;
  API_TIMER_PATH: string;
  API_PROJECT_PATH: string;
  API_CATEGORY_PATH: string;
  API_META_INFO_PATH: string;
  API_WORK_SESSION_PATH: string;

  TIMER_BROADCAST_CHANNEL: string;
  PROJECT_BROADCAST_CHANNEL: string;
  CATEGORY_BROADCAST_CHANNEL: string;

  // server
  SERVER_ID: string;
  SERVER_NAMESPACE: string;

  // timer
  DEFAULT_TIMER_DURATION_MS: number;
  SHOW_TIMER_NOTIFICATIONS: boolean;
}

export type PublicConfigInterface = Pick<ConfigInterface, "FIRST_DAY_OF_WEEK">;
