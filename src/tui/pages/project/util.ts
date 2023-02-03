import {
  MS_IN_ONE_DAY,
  unixMsTimestampToUsLocaleDateString,
} from "common/util/date-time";

import { Writable } from "type-fest";
import { Message } from "tui/interface";
import { formatMessageForBlessedElement } from "tui/util";
import { ProjectFields, ProjectStatus } from "entities/project/project";

const statusType: { [key in ProjectStatus]: Message["type"] } = {
  halted: "warn",
  ongoing: "success",
  completed: "disabled",
};

export function formatProjectObjectForTable(project: Writable<ProjectFields>) {
  project.status = formatMessageForBlessedElement({
    text: project.status,
    type: statusType[project.status],
  }) as any;

  project.createdAt = unixMsTimestampToUsLocaleDateString(
    project.createdAt
  ) as any;

  if (project.deadline) {
    const dateString = unixMsTimestampToUsLocaleDateString(project.deadline);
    const dateDiff = Date.now() - project.deadline;

    let messageType: Message["type"];

    if (project.status === "completed") messageType = "disabled";
    else if (dateDiff < 7 * MS_IN_ONE_DAY) messageType = "error";
    else if (dateDiff < 30 * MS_IN_ONE_DAY) messageType = "warn";
    else messageType = "normal";

    project.deadline = formatMessageForBlessedElement({
      text: dateString,
      type: messageType,
    }) as any;
  }

  return project;
}

export function formatProjectForForm(project: ProjectFields) {
  const clone = { ...project };

  clone.createdAt = unixMsTimestampToUsLocaleDateString(
    project.createdAt
  ) as any;

  if (project.deadline)
    clone.deadline = unixMsTimestampToUsLocaleDateString(
      project.deadline
    ) as any;

  return clone;
}

const projectStatusValues = Object.freeze({
  ongoing: 1,
  halted: 2,
  completed: 3,
} as const);
export function sortProjectsBasedOnStatus(projects: ProjectFields[]) {
  projects.sort(
    (a, b) => projectStatusValues[a.status] - projectStatusValues[b.status]
  );
}
