import type {
  ProjectFields,
  MakeProject_Argument,
} from "entities/project/project";
import type { Client } from "express-ipc";
import type { Writable } from "type-fest";
import type { EditProject_Argument } from "use-cases/interfaces/project-service";

export interface ProjectService_Argument {
  url: string;
  client: Client;
}

export type ProjectInterface = Writable<ProjectFields>;

type GetProjectQuery =
  | { lookup: "all" }
  | { lookup: "byId"; id: string }
  | { lookup: "byName"; name: string };

export default class ProjectService {
  #client: Client;
  readonly #url: string;

  constructor(arg: ProjectService_Argument) {
    this.#client = arg.client;
    this.#url = arg.url;
  }

  async findAll(): Promise<ProjectInterface[]> {
    return this.#getProjects({ lookup: "all" });
  }
  async findById(arg: { id: string }): Promise<ProjectInterface | null> {
    return this.#getProjects({ lookup: "byId", id: arg.id });
  }
  async findByName(arg: { name: string }): Promise<ProjectInterface[]> {
    return this.#getProjects({ lookup: "byName", name: arg.name });
  }

  async add(project: MakeProject_Argument): Promise<ProjectInterface> {
    const { body } = (await this.#client.request({
      body: project,
      method: "post",
      url: this.#url,
    })) as any;

    if (!body.success) throw body.error;
    return body.data;
  }

  async edit(arg: EditProject_Argument): Promise<ProjectInterface> {
    const { id, changes } = arg;
    const { body } = (await this.#client.request({
      url: this.#url,
      method: "patch",
      body: { id, changes },
    })) as any;

    if (!body.success) throw body.error;
    return body.data;
  }

  async #getProjects(query: GetProjectQuery) {
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
