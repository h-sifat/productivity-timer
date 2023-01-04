import EPP from "common/util/epp";

export interface BackupManagerConstructor_Argument {
  BACKUP_INTERVAL_MS: number;
  backupDatabase(): Promise<void>;
  getLastBackupTime(): Promise<number | null>;

  // we're wrapping these functions to make the
  // initBackupManager function testable.

  /**
   * A wrapper for the Date.now() function
   * */
  currentTimeMs?: () => number;
  /**
   * A wrapper for the setTimeout() function.
   * */
  scheduleTask?: (f: () => any, timeout: number) => any;

  /**
   * A wrapper for the clearTimeout() function.
   * */
  clearScheduledTask?: (timerId: any) => void;
}

export class BackupManager {
  static #instance: BackupManager | null = null;

  readonly #scheduleTask: NonNullable<
    BackupManagerConstructor_Argument["scheduleTask"]
  >;
  readonly #clearScheduledTask: NonNullable<
    BackupManagerConstructor_Argument["clearScheduledTask"]
  >;
  readonly #currentTimeMs: NonNullable<
    BackupManagerConstructor_Argument["currentTimeMs"]
  >;
  readonly #backupDatabase: BackupManagerConstructor_Argument["backupDatabase"];
  readonly #getLastBackupTime: BackupManagerConstructor_Argument["getLastBackupTime"];
  readonly #BACKUP_INTERVAL_MS: BackupManagerConstructor_Argument["BACKUP_INTERVAL_MS"];

  #timeoutId: any = null;
  #isKilled = false;

  constructor(arg: BackupManagerConstructor_Argument) {
    this.#backupDatabase = arg.backupDatabase;
    this.#getLastBackupTime = arg.getLastBackupTime;
    this.#BACKUP_INTERVAL_MS = arg.BACKUP_INTERVAL_MS;

    this.#currentTimeMs = arg.currentTimeMs || Date.now;
    this.#scheduleTask = arg.scheduleTask || setTimeout;
    this.#clearScheduledTask = arg.clearScheduledTask || clearTimeout;

    if (BackupManager.#instance) return BackupManager.#instance;
    else BackupManager.#instance = this;
  }

  async init() {
    await this.#doBackup();
  }

  #doBackup = async () => {
    if (this.#isKilled) return;
    if (this.#timeoutId) this.#clearScheduledTask(this.#timeoutId);

    const lastBackupTime = await this.#getLastBackupTime();

    const { shouldBackup, remainingTimeBeforeNextBackup } = (() => {
      if (!lastBackupTime)
        return {
          shouldBackup: true,
          remainingTimeBeforeNextBackup: this.#BACKUP_INTERVAL_MS,
        };

      const diff = this.#currentTimeMs() - lastBackupTime;
      if (diff < 0)
        throw new EPP({
          code: "BACKUP_CANCELED:INVALID_TIME",
          message: `Database backup canceled because current is less than lastBackupTime.`,
          otherInfo: {
            possible_fixes: [
              `Fix the time.`,
              `Delete the single record from the meta_info table manually.`,
            ],
          },
        });

      return diff >= this.#BACKUP_INTERVAL_MS
        ? {
            shouldBackup: true,
            remainingTimeBeforeNextBackup: this.#BACKUP_INTERVAL_MS,
          }
        : {
            shouldBackup: false,
            remainingTimeBeforeNextBackup: this.#BACKUP_INTERVAL_MS - diff,
          };
    })();

    if (shouldBackup) await this.#backupDatabase();
    this.#timeoutId = this.#scheduleTask(
      this.#doBackup,
      remainingTimeBeforeNextBackup
    );
  };

  kill() {
    this.#isKilled = true;
    if (this.#timeoutId) this.#clearScheduledTask(this.#timeoutId);

    BackupManager.#instance = null;
  }
}
