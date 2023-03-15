import EPP from "common/util/epp";
import { Option } from "commander";
import { Client } from "express-ipc";
import type { Command } from "commander";
import { withClient } from "cli/util/client";
import { isEmptyObject } from "common/util/other";
import ProjectService from "client/services/project";
import { TimerService } from "client/services/timer";
import CategoryService from "client/services/category";
import { printCategoriesAsTable } from "cli/util/category";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";
import { DurationOption, printTimerMethodCallResult } from "cli/util/timer";

export function addTimerStartCommand(program: Command) {
  program
    .command("start")
    .description(
      "Starts a countdown timer. The timer can be for a specific project/category or anonymous."
    )
    .alias("s")
    .addOption(
      new Option(
        "-c, --category",
        "indicates that it's a category timer"
      ).conflicts("project")
    )
    .addOption(
      new Option(
        "-p, --project",
        "indicates that it's a project timer"
      ).conflicts("category")
    )
    .addOption(
      new Option(
        "-n, --name <string>",
        "the name of the project or category"
      ).conflicts("id")
    )
    .addOption(
      new Option(
        "-i, --id <string>",
        "the id of the project or category"
      ).conflicts("name")
    )
    .addOption(
      new Option(
        "-l, --last",
        "start the timer with the previous reference if exists."
      ).conflicts(["name", "id", "project", "category"])
    )
    .option("--json", "print raw JSON.")
    .addOption(DurationOption)
    .action(startTimer);
}

type startTimer_Options =
  | { duration?: number; last?: boolean; json?: boolean } & ((
      | { name: string }
      | { id: string }
    ) &
      ({ category: true } | { project: true }));

interface StartCommand {
  name: "start";
  arg: null | {
    duration?: number;
    ref: null | {
      id: string;
      name?: string | undefined;
      type: "project" | "category";
    };
    usePreviousRef?: boolean;
  };
}

async function startTimer(options: startTimer_Options) {
  await withClient(async (client) => {
    assertValidOptions(options);

    const startCommand: StartCommand = await makeStartCommand({
      client,
      options,
    });

    const timerService = new TimerService({
      client,
      url: config.API_TIMER_PATH,
    });

    const data = await timerService.start(startCommand.arg);
    if (options.json) return console.log(JSON.stringify(data));

    await printTimerMethodCallResult(data);
  });
}

interface makeStartCommand_Arg {
  client: Client;
  options: startTimer_Options;
}
async function makeStartCommand(
  arg: makeStartCommand_Arg
): Promise<StartCommand> {
  const { options } = arg;

  if (isEmptyObject(options)) return { name: "start", arg: null };

  const { client } = arg;

  const startCommand: StartCommand = { name: "start", arg: { ref: null } };
  if ("duration" in options) startCommand.arg!.duration = options.duration;

  if ("last" in options) {
    startCommand.arg!.usePreviousRef = true;
    return startCommand;
  }

  if ("category" in options) {
    const categoryService = new CategoryService({
      client,
      url: config.API_CATEGORY_PATH,
    });

    if ("id" in options) {
      const { id } = options;

      const category = await categoryService.findById({ id });

      if (!category)
        throw new EPP({
          code: "NOT_FOUND",
          message: `No category found with the id: "${id}"`,
        });

      startCommand.arg!.ref = { type: "category", id, name: category.name };
      return startCommand;
    }

    const { name } = options;

    const categories = await categoryService.findByName({ name });

    if (!categories.length)
      throw new EPP({
        code: "NOT_FOUND",
        message: `No category found with the name: "${name}"`,
      });

    if (categories.length > 1) {
      printCategoriesAsTable(categories);
      throw new EPP({
        code: "AMBIGUOUS_CATEGORY_NAME",
        message: `Category name is ambiguous.`,
      });
    }

    const category = categories[0];
    startCommand.arg!.ref = {
      id: category.id,
      type: "category",
      name: category.name,
    };
  } else if ("project" in options) {
    const projectService = new ProjectService({
      client,
      url: config.API_PROJECT_PATH,
    });

    const project =
      "id" in options
        ? await projectService.findById({ id: options.id })
        : await projectService.findByName({ name: (<any>options).name });

    if (!project) {
      let message = "No project found with the";
      message +=
        "id" in options
          ? ` id: "${options.id}".`
          : ` name: "${(<any>options).name}"`;
      throw new EPP({ code: "NOT_FOUND", message });
    }

    startCommand.arg!.ref = {
      id: project.id,
      type: "project",
      name: project.name,
    };
  }

  return startCommand;
}

function assertValidOptions(options: any) {
  const refTypeExists = options.category || options.project;
  const nameOrIdExists = "name" in options || "id" in options;

  if (refTypeExists && !nameOrIdExists)
    throw new Error(`The options "name" or "id" is missing.`);

  if (nameOrIdExists && !refTypeExists)
    throw new Error(`The options "category" or "project" is missing.`);
}
