type TimerCallback = (...arg: any[]) => any | Promise<any>;

/*
 * When the TUI quits we need to clear all active timers otherwise the process
 * won't exist. That's why I'm making this wrapper.
 * */
export default class TimerManager {
  readonly #key: string;
  readonly #timers = Object.freeze({
    timeout: new Set<NodeJS.Timeout>(),
    interval: new Set<NodeJS.Timeout>(),
  });

  constructor(arg: { key: string }) {
    this.#key = arg.key;
  }

  setTimeout = (
    callback: TimerCallback,
    time: number,
    arg?: any
  ): NodeJS.Timeout => {
    const id = setTimeout(callback, time, arg);
    this.#timers.timeout.add(id);
    return id;
  };

  clearTimeout = (id: NodeJS.Timeout) => {
    if (this.#timers.timeout.has(id)) {
      this.#timers.timeout.delete(id);
      clearTimeout(id);
    }
  };

  setInterval = (
    callback: TimerCallback,
    time: number,
    arg?: any
  ): NodeJS.Timeout => {
    const id = setInterval(callback, time, arg);
    this.#timers.interval.add(id);
    return id;
  };

  clearInterval = (id: NodeJS.Timeout) => {
    if (this.#timers.interval.has(id)) {
      this.#timers.interval.delete(id);
      clearInterval(id);
    }
  };

  clearAllIntervals(key: string) {
    this.#assertValidKey(key);
    this.#timers.interval.forEach(clearInterval);
  }

  clearAllTimeouts(key: string) {
    this.#assertValidKey(key);
    this.#timers.timeout.forEach(clearInterval);
  }

  clear(key: string) {
    this.#assertValidKey(key);

    this.#timers.timeout.forEach(clearInterval);
    this.#timers.interval.forEach(clearInterval);
  }

  #assertValidKey(key: string) {
    if (key !== this.#key) throw new Error(`Not allowed!`);
  }
}
