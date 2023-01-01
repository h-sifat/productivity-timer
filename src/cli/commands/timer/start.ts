import {
  getCategoryById,
  getCategoryByName,
  printCategoriesAsTable,
} from "cli/util/category";
import EPP from "common/util/epp";
import { Option } from "commander";
import { Client } from "express-ipc";
import type { Command } from "commander";
import { withClient } from "cli/util/client";
import { getProject } from "cli/util/project";
import { DurationOption, printTimerMethodCallResult } from "cli/util/timer";
import { isEmptyObject } from "common/util/other";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";

export function addTimerStartCommand(program: Command) {
  program
    .command("start")
    .description(
      "Starts a countdown timer. The timer can be for a specific project/category or anonymous."
    )
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
    .addOption(DurationOption)
    .action(startTimer);
}

type startTimer_Options =
  | { duration?: number }
  | (({ name: string } | { id: string }) &
      ({ category: true } | { project: true }))
  | {};

interface StartCommand {
  name: "start";
  arg: null | {
    duration?: number;
    ref: null | {
      id: string;
      name?: string | undefined;
      type: "project" | "category";
    };
  };
}

async function startTimer(options: startTimer_Options) {
  await withClient(async (client) => {
    assertValidOptions(options);

    const startCommand: StartCommand = await makeStartCommand({
      client,
      options,
    });

    const { body } = (await client.post(config.API_TIMER_PATH, {
      query: {},
      headers: {},
      body: startCommand,
    })) as any;

    if (!body.success) throw body.error;

    printTimerMethodCallResult(body.data);
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

  if ("category" in options) {
    if ("id" in options) {
      const { id } = options;
      const category = await getCategoryById({
        id,
        client,
        throwIfNotFound: true,
      });

      startCommand.arg!.ref = { type: "category", id, name: category.name };
      return startCommand;
    }

    const { name } = options;
    const categories = await getCategoryByName({
      name,
      client,
      throwIfNotFound: true,
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

    return startCommand;
  }

  // so, now the ref type is project
  const nameOrId =
    "id" in options ? { id: options.id } : { name: (<any>options).name };
  const project = await getProject({
    client,
    ...nameOrId,
    throwIfNotFound: true,
  });

  startCommand.arg!.ref = {
    id: project.id,
    type: "project",
    name: project.name,
  };

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
