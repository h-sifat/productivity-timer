import type { Client } from "express-ipc";
import type { PublicMetaInfoInterface } from "entities/meta";

export interface MetaInfoService_Argument {
  url: string;
  client: Client;
}

export default class MetaInfoService {
  #client: Client;
  readonly #url: string;

  constructor(arg: MetaInfoService_Argument) {
    this.#client = arg.client;
    this.#url = arg.url;
  }

  async get() {
    const { body } = (await this.#client.request({
      method: "get",
      url: this.#url,
    })) as any;

    if (!body.success) throw body.error;
    return body.data;
  }

  async edit(changes: Partial<PublicMetaInfoInterface>) {
    const { body } = (await this.#client.request({
      method: "patch",
      url: this.#url,
      body: { changes },
    })) as any;

    if (!body.success) throw body.error;
    return body.data;
  }

  set client(client: Client) {
    this.#client = client;
  }
}
