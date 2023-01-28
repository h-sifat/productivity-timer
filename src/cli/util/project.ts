import { formatDateProperties } from "cli/util";

export function preprocessProject(project: any): any {
  return formatDateProperties({
    type: "date",
    object: project,
    dateProperties: ["createdAt", "deadline"],
  });
}
