import type { Debug } from "tui/interface";
import type { Alert } from "tui/components/alert";
import type ProjectService from "client/services/project";
import type { ProjectFields } from "entities/project/project";

import { Form } from "tui/components/form";
import { Page } from "tui/components/page";
import { formatMessageForBlessedElement } from "tui/util";
import { Table, OnProjectSubmit } from "tui/components/table";
import {
  formatProjectForForm,
  formatProjectObjectForTable,
  sortProjectsBasedOnStatus,
} from "./util";

export interface createProjectPage_Argument {
  alert: Alert;
  debug: Debug;
  renderScreen(): void;
  projectService: ProjectService;
  prompt(message: string): Promise<boolean>;
}

export function createProjectPage(arg: createProjectPage_Argument) {
  const { debug, renderScreen } = arg;
  const projectFields = Object.freeze([
    "id",
    "name",
    "status",
    "createdAt",
    "deadline",
    "categoryId",
    "description",
  ]);

  // --------------------- Components ----------------------------------
  const projectForm = new Form<ProjectFields>({
    border: true,
    renderScreen,
    position: { bottom: 0 },
    fields: projectFields as any,
    disabled: ["id", "createdAt"],
  });

  const formHeight = Form.calculateHeight({
    border: true,
    fieldsCount: projectFields.length,
  });

  const projectsTable = new Table<ProjectFields>({
    debug,
    renderScreen,
    formatObject: formatProjectObjectForTable,
    dimension: { height: `100%-${formHeight - 1}` },
    columns: projectFields.filter((field) => field !== "categoryId"),
    additionalInstructions: { "shift-a": "add new", "shift-d": "delete" },
  });

  const projectsPage = new Page({
    top: 1,
    debug,
    renderScreen,
    children: [projectsTable.element, projectForm.element],
  });

  // ----------------- Project Table Event Handling ------------------------
  function handleProjectChange({
    object: project,
  }: Parameters<OnProjectSubmit<ProjectFields>>[0]) {
    if (project)
      projectForm.update({
        formLabel: `[${project.name}]`,
        object: formatProjectForForm(project) as any,
        message: { text: "Edit and submit to update.", type: "info" },
      });
    else
      projectForm.update({
        object: null,
        formLabel: `[New]`,
        message: { text: "Create a new project", type: "info" },
      });
  }

  projectsTable.onCursorMove = handleProjectChange;
  projectsTable.onSubmit = (arg) => {
    handleProjectChange(arg);
    projectForm.element.focus();
    renderScreen();
  };

  projectsTable.element.key("S-a", () => {
    handleProjectChange({ project: null } as any);
    projectForm.element.focus();
    renderScreen();
  });

  projectsTable.element.key("S-d", async () => {
    const selectedProject = projectsTable.selected;
    if (!selectedProject) return;

    const { name, id } = selectedProject;

    const message = `Are you sure you want to delete project "${name}" (${id})? All of it's work sessions will be deleted too!`;
    const shouldDelete = await arg.prompt(message);

    try {
      if (shouldDelete) await arg.projectService.delete({ id });
    } catch (ex) {
      arg.alert({ text: ex.message, type: "error" });
    }
  });

  // ----------------- Project Form Event Handling ------------------------
  projectForm.onSubmit = async ({ object: project }) => {
    const filteredChanges = [
      "name",
      "status",
      "deadline",
      "categoryId",
      "description",
    ].reduce((filtered, property) => {
      const value: string = (<any>project)[property];
      if (value.length) filtered[property] = value;
      return filtered;
    }, {} as any);

    if (filteredChanges.deadline) {
      const date = new Date(filteredChanges.deadline);
      if (Number.isNaN(date.valueOf())) {
        projectForm.updateMessage({
          text: "Invalid date. Valid format: mm/dd/yyyy",
          type: "error",
        });
        return;
      }

      filteredChanges.deadline = date.valueOf();
    }

    try {
      if (project.id) {
        const editedProject = await arg.projectService.edit({
          id: project.id,
          changes: filteredChanges,
        });

        const message = formatMessageForBlessedElement({
          type: "success",
          text: `Successfully edited project "${editedProject.name}"`,
        });
        arg.alert({ text: message, type: "log" });
      } else await arg.projectService.add(filteredChanges as any);
    } catch (ex) {
      projectForm.updateMessage({ text: ex.message, type: "error" });
    }
  };

  // --------------------- Other --------------------------
  function loadProjects(projects: readonly ProjectFields[]) {
    const cloned = [...projects];
    sortProjectsBasedOnStatus(cloned);

    projectsTable.updateRows({ rowObjects: cloned });
  }

  return Object.freeze({
    loadProjects,
    from: projectForm,
    page: projectsPage,
    table: projectsTable,
  });
}
