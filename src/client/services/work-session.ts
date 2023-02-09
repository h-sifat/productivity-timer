import type { Client } from "express-ipc";
import type { StatisticsInterface } from "use-cases/interfaces/work-session-db";
import type { WorkSessionServiceInterface } from "use-cases/interfaces/work-session-service";
import type { GetWorkSessionsQuerySchemaInterface } from "src/controllers/work-session/get-work-sessions";

export interface WorkSessionService_Argument {
  url: string;
  client: Client;
}

export default class WorkSessionService {
  #client: Client;
  readonly #url: string;

  constructor(arg: WorkSessionService_Argument) {
    this.#client = arg.client;
    this.#url = arg.url;
  }

  async getStats(): Promise<StatisticsInterface> {
    return this.get({ lookup: "stats" });
  }

  async getWorkSessions(
    arg: Parameters<
      WorkSessionServiceInterface["listWorkSessionsByDateRange"]
    >[0]
  ): ReturnType<WorkSessionServiceInterface["listWorkSessionsByDateRange"]> {
    return this.get({ lookup: "work-sessions", arg });
  }

  async get(query: GetWorkSessionsQuerySchemaInterface) {
    const { body } = (await this.#client.request({
      query,
      method: "get",
      url: this.#url,
    })) as any;

    if (!body.success) throw body.error;
    return body.data;
  }

  set client(client: Client) {
    this.#client = client;
  }
}
