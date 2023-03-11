import type { Client } from "express-ipc";
import type { ClientServiceArgument } from "./interface";
import type { PublicConfigInterface } from "src/config/interface";

export default class ConfigService {
  #client: Client;
  readonly #url: string;

  constructor(arg: ClientServiceArgument) {
    this.#client = arg.client;
    this.#url = arg.url;
  }

  async get(): Promise<PublicConfigInterface> {
    const { body } = await this.#client.get(this.#url);
    if (!body.success) throw body.error;

    return body.data;
  }
}
