import EPP from "common/util/epp";
import { Constructor_Argument } from "src/countdown-timer/timer";

export default function createFakeIntervalTimer() {
  let currentTimerId = 0;
  const allFakeTimers: {
    [k: string]: { interval: number; callback: Function };
  } = {};

  // @ts-expect-error I know! now shut up.
  const fakeSetInterval: Constructor_Argument["setInterval"] = (arg) => {
    const { interval, callback } = arg;

    allFakeTimers[++currentTimerId] = Object.freeze({
      interval,
      callback,
    });

    return currentTimerId.toString();
  };

  const fakeClearInterval: Constructor_Argument["clearInterval"] = (
    timerId
  ) => {
    // @ts-ignore
    delete allFakeTimers[timerId];
  };

  function clearAllFakeTimers() {
    // @ts-ignore
    for (const key of Object.keys(allFakeTimers)) delete allFakeTimers[key];
  }

  function getCurrentFakeTimerId() {
    return currentTimerId.toString();
  }

  function manualTick(timerId: any) {
    if (!(timerId in allFakeTimers))
      throw new EPP({
        code: "INTERNAL_ERROR:NO_FAKE_TIMER_EXISTS",
        message: `Not fake interval timer exists with the id: ${timerId}`,
      });

    try {
      allFakeTimers[timerId].callback();
    } catch {}
  }

  return {
    manualTick,
    allFakeTimers,
    fakeSetInterval,
    fakeClearInterval,
    clearAllFakeTimers,
    getCurrentFakeTimerId,
  };
}
