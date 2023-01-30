import type {
  TimerCommandNames,
  TimerCommandResponsePayload,
} from "src/controllers/timer/post-command";
import type { Client } from "express-ipc";
import { TimerInfo } from "src/countdown-timer/type";
import { TimerRefWithName } from "src/controllers/timer/interface";

export interface TimerService_Argument {
  url: string;
  client: Client;
}

export interface TimerCommand_Arguments {
  start: null | {
    duration?: number;
    ref: null | {
      id: string;
      name?: string | undefined;
      type: "project" | "category";
    };
  };
  reset: { hard?: boolean; duration?: number };
  setDuration: { duration: number };
  startBreak: { duration: number };
}

export class TimerService {
  #client: Client;
  readonly #url: string;

  constructor(arg: TimerService_Argument) {
    this.#url = arg.url;
    this.#client = arg.client;
  }

  async start(arg: TimerCommand_Arguments["start"] = null) {
    return this.#sendCommand({ command: "start", arg });
  }

  async startBreak(arg: TimerCommand_Arguments["startBreak"]) {
    return this.start({ duration: arg.duration, ref: null });
  }

  async end() {
    return this.#sendCommand({ command: "end" });
  }

  async pause() {
    return this.#sendCommand({ command: "pause" });
  }

  async getInfo(): Promise<TimerInfo<TimerRefWithName>> {
    return this.#sendCommand({ command: "info" }) as any;
  }

  async reset(arg: TimerCommand_Arguments["reset"] = {}) {
    return this.#sendCommand({ command: "reset", arg });
  }

  async setDuration(arg: TimerCommand_Arguments["setDuration"]) {
    return this.#sendCommand({ command: "setDuration", arg });
  }

  async #sendCommand(arg: {
    arg?: any;
    command: TimerCommandNames;
  }): Promise<TimerCommandResponsePayload> {
    const { body } = (await this.#client.request({
      body: arg,
      method: "post",
      url: this.#url,
    })) as any;

    if (!body.success) throw body.error;

    return body.data;
  }

  set client(client: Client) {
    this.#client = client;
  }
}
