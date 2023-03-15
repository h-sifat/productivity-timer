import { Option } from "commander";
import type { Command } from "commander";
import { withClient } from "cli/util/client";
import { printTree } from "flexible-tree-printer";
import { formatString, printObjectAsBox } from "cli/util";
import { CategoryFields } from "entities/category/category";
import { API_AND_SERVER_CONFIG as config } from "src/config/other";
import { preprocessCategory, printCategoriesAsTable } from "cli/util/category";
import type { QuerySchemaInterface } from "src/controllers/category/get-categories";

export function addListCategoriesCommand(ListCommand: Command) {
  ListCommand.command("categories")
    .alias("c")
    .description("Lists all the categories")
    .addOption(
      new Option("-i, --id <string>", "find category by id").conflicts("name")
    )
    .addOption(
      new Option("-n, --name <string>", "find category by name").conflicts([
        "id",
        "parents",
        "children",
      ])
    )
    .addOption(
      new Option("-p, --parents", "find parent categories").conflicts(
        "children"
      )
    )
    .addOption(
      new Option("-c, --children", "find sub-categories").conflicts("parent")
    )
    .addOption(new Option("--json", "print raw JSON.").conflicts(["tree"]))
    .addOption(
      new Option("-t, --tree", "print categories as a tree.").conflicts([
        "id",
        "name",
        "json",
        "parents",
        "children",
      ])
    )
    .action(listCategories);
}

type listCategories_Option = ({ json?: true } | { tree?: true }) &
  ({ id?: string } | { name?: string }) &
  ({ parents?: true } | { children?: true });

export async function listCategories(options: listCategories_Option) {
  const query = makeQueryFromOptions(options);

  await withClient(async (client) => {
    const { body } = (await client.get(config.API_CATEGORY_PATH, {
      query,
    })) as any;

    if (!body.success) throw body.error;

    if ("json" in options) console.log(JSON.stringify(body.data));
    else if (Array.isArray(body.data)) {
      const categories = body.data as CategoryFields[];
      if (!categories.length)
        console.log(
          formatString({ string: "No category found.", color: "red" })
        );
      else if ("tree" in options) printCategoriesAsTree(categories);
      else printCategoriesAsTable(categories);
    } else if (!body.data)
      console.log(formatString({ string: "Not found.", color: "red" }));
    else printObjectAsBox({ object: preprocessCategory(body.data) });
  });
}

function makeQueryFromOptions(
  options: listCategories_Option
): QuerySchemaInterface {
  if ("name" in options) return { lookup: "selfByName", name: options.name };
  if ("id" in options) {
    const { id } = options;
    if ("parents" in options) return { lookup: "parents", id };
    if ("children" in options) return { lookup: "children", id };
    else return { lookup: "selfById", id };
  }
  return { lookup: "all" };
}

function printCategoriesAsTree(categories: CategoryFields[]) {
  const tree = buildTree(categories);
  printTree({
    printRootNode: () =>
      console.log(formatString({ string: ".", color: "yellow" })),
    parentNode: tree,
    getSubNodes: ({ parentNode }) =>
      parentNode!.children.map((child: any) => ({
        name: child.name,
        value: child,
      })),
    printNode({ nodePrefix, node }) {
      const name = formatString({ string: node.name, color: "green" });
      const prefix = formatString({
        string: nodePrefix.join(""),
        color: "yellow",
      });
      const id = formatString({ color: "grey", string: `(${node.value.id})` });
      const line = `${prefix}${name} ${id}`;
      console.log(line);
    },
  });
}

type Branch = CategoryFields & { children: Branch[]; isRoot: boolean };

interface Tree {
  [key: string | symbol]: Branch;
}

function buildTree(categories: CategoryFields[]) {
  const tree: Tree = {};
  const DEFAULT_ROOT_ID = Symbol();

  for (const category of categories) {
    const currentBranch: Branch = {
      ...category,
      isRoot: false,
      children: [] as Branch[],
    };

    if (category.id in tree) {
      currentBranch.children = tree[category.id]!.children;
      tree[category.id] = currentBranch;
    } else tree[category.id] = currentBranch;

    const parentId = category.parentId || DEFAULT_ROOT_ID;

    if (!tree[parentId]) {
      const parentBranch: Branch = {
        name: "",
        children: [],
        // @ts-ignore I know
        id: parentId,
        isRoot: true,
      };

      tree[parentId] = parentBranch;
    }

    tree[parentId]!.children.push(currentBranch);
  }

  if (tree[DEFAULT_ROOT_ID]) return tree[DEFAULT_ROOT_ID];
  for (const branch of Object.values(tree)) if (branch.isRoot) return branch;
  throw new Error("Parent not found");
}
