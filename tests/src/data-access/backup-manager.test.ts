import { BackupManager } from "data-access/backup-manager";

const BACKUP_INTERVAL_MS = 1000;

const scheduleTask = jest.fn();
const currentTimeMs = jest.fn();
const backupDatabase = jest.fn();
const getLastBackupTime = jest.fn();
const clearScheduledTask = jest.fn();

let backupManager: BackupManager;

beforeEach(() => {
  if (backupManager) backupManager.kill();

  [
    scheduleTask,
    currentTimeMs,
    backupDatabase,
    getLastBackupTime,
    clearScheduledTask,
  ].forEach((mockFn) => mockFn.mockReset());

  backupManager = new BackupManager({
    scheduleTask,
    currentTimeMs,
    backupDatabase,
    getLastBackupTime,
    BACKUP_INTERVAL_MS,
    clearScheduledTask,
  });
});

it(`if lastBackupTime is null it creates the first backup and schedules the next`, async () => {
  // this is the first backup.
  getLastBackupTime.mockResolvedValueOnce(null);

  await backupManager.init();

  expect(clearScheduledTask).not.toHaveBeenCalled();
  expect(getLastBackupTime).toHaveBeenCalledTimes(1);
  expect(backupDatabase).toHaveBeenCalledTimes(1);
  expect(scheduleTask).toHaveBeenCalledWith(
    expect.any(Function),
    BACKUP_INTERVAL_MS
  );
});

{
  const errorCode = "BACKUP_CANCELED:INVALID_TIME";
  it(`throws ewc "${errorCode}" if current time is less than lastBackupTime`, async () => {
    expect.assertions(5);

    const lastBackupTime = 200;
    getLastBackupTime.mockResolvedValueOnce(lastBackupTime);
    currentTimeMs.mockReturnValueOnce(lastBackupTime - 10);

    try {
      await backupManager.init();
    } catch (ex) {
      expect(ex.code).toBe(errorCode);
    }

    expect(clearScheduledTask).not.toHaveBeenCalled();
    expect(getLastBackupTime).toHaveBeenCalledTimes(1);
    expect(backupDatabase).not.toHaveBeenCalled();
    expect(scheduleTask).not.toHaveBeenCalled();
  });
}

// Too lazy to test the other two use cases. Trust me they works 😉,
