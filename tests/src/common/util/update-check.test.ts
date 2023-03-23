import { showUpdateNotification } from "common/util/update-check";

const notify = jest.fn();
const checkUpdate = jest.fn();
const scheduleTask = jest.fn();

const showUpdateArg = Object.freeze({
  notify,
  checkUpdate,
  scheduleTask: scheduleTask as any,
});

beforeEach(() => {
  Object.values(showUpdateArg).forEach((method) => method.mockReset());
});

it(`calls the notify function if an update is available.`, async () => {
  showUpdateArg.checkUpdate.mockResolvedValueOnce({ latest: "1.1.0" });
  await showUpdateNotification({ ...showUpdateArg });

  expect(checkUpdate).toHaveBeenCalledTimes(1);
  expect(notify).toHaveBeenCalledTimes(1);
  expect(notify).toHaveBeenCalledWith(expect.any(String));
  expect(scheduleTask).not.toHaveBeenCalled();
});

it(`retries the update check if "retry" is true`, async () => {
  showUpdateArg.checkUpdate.mockRejectedValueOnce(new Error("failed"));
  await showUpdateNotification({ ...showUpdateArg, retry: true });

  expect(checkUpdate).toHaveBeenCalledTimes(1);
  expect(notify).not.toHaveBeenCalled();

  expect(scheduleTask).toHaveBeenCalledTimes(1);
  expect(scheduleTask).toHaveBeenCalledWith(
    showUpdateNotification,
    expect.any(Number),
    { notify, retry: false }
  );
});

it(`doesn't retry the update check if "retry" flag is false`, async () => {
  showUpdateArg.checkUpdate.mockRejectedValueOnce(new Error("failed"));
  await showUpdateNotification({ ...showUpdateArg, retry: false });

  expect(checkUpdate).toHaveBeenCalledTimes(1);
  expect(notify).not.toHaveBeenCalled();
  expect(scheduleTask).not.toHaveBeenCalled();
});
