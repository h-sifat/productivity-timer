declare global {
  var __APP_VERSION__: string;
  var __CLI_FILE_NAME__: string;
  var __SERVER_FILE_NAME__: string;
  var __DB_SUBPROCESS_FILE_NAME__: string;
  var __M_PLAYER_AUDIO_FILE_NAME__: string;
  var __BUILD_MODE__: "production" | "development";
}

export {};
