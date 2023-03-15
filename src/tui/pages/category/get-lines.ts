import { printTree } from "flexible-tree-printer";
import type { CategoryBranch } from "src/entities/category/build-tree";

interface getTreeLines_Argument {
  rootBranch: CategoryBranch;
  folded?: Set<string>;
}

export interface TreeLine {
  id: string;
  line: string;
}

export function getTreeLines(arg: getTreeLines_Argument): TreeLine[] {
  const { folded = new Set(), rootBranch } = arg;

  type LineInfo = {
    id: string;
    name: string;
    hasSubNodes: boolean;
    nodePrefix: string[];
  };
  const map = new Map<string, LineInfo>();

  printTree<CategoryBranch>({
    printRootNode() {},
    parentNode: rootBranch,
    shouldDescend({ parentNode: parentBranch }) {
      return !folded.has(parentBranch!.value.id);
    },

    getSubNodes({ parentNode: parentBranch }) {
      const children = parentBranch!.children.map((branch) => ({
        value: branch,
        name: branch.value.name,
      }));

      const parentId = parentBranch!.value.id;

      if (map.has(parentId))
        map.get(parentId)!.hasSubNodes = Boolean(children.length);

      return children;
    },
    printNode({ node, nodePrefix }) {
      const branch = node.value;
      const { id, name } = branch.value;
      map.set(id, { id, name, nodePrefix, hasSubNodes: false });
    },
  });

  const lineObjects = [...map.values()].map(
    ({ id, nodePrefix, hasSubNodes, name }) => {
      if (folded.has(id) && hasSubNodes) nodePrefix.push("+", " ");

      const line = nodePrefix.join("") + name;
      return { id, line };
    }
  );

  const treeLines = [{ id: "", line: "." }, ...lineObjects];
  return treeLines;
}
