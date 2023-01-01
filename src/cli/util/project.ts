import EPP from "common/util/epp";
import type { Client } from "express-ipc";
import { formatDateProperties } from "cli/util";
import { ProjectFields } from "entities/project/project";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";

export function preprocessProject(project: any): any {
  return formatDateProperties({
    type: "date",
    object: project,
    dateProperties: ["createdAt", "deadline"],
  });
}

type getProject_Argument = { client: Client; throwIfNotFound?: boolean } & (
  | { id: string }
  | { name: string }
);
export async function getProject(
  arg: getProject_Argument
): Promise<ProjectFields> {
  const { client, throwIfNotFound = false } = arg;

  const query =
    "id" in arg
      ? { lookup: "byId", id: arg.id }
      : { lookup: "byName", name: arg.name };

  const { body } = (await client.get(config.API_PROJECT_PATH, {
    query,
  })) as any;

  if (!body.success) throw body.error;

  const project = body.data;

  if (!project && throwIfNotFound) {
    let message = "No project found with the";
    message += "id" in arg ? ` id: "${arg.id}".` : ` name: "${arg.name}"`;
    throw new EPP({ code: "NOT_FOUND", message });
  }

  return project;
}
