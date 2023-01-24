import { CategoryFields as Category } from "src/entities/category/category";

export type CategoryBranch = {
  isMock?: true;
  value: Category;
  children: CategoryBranch[];
};

export interface CategoryTree {
  [key: string | symbol]: CategoryBranch;
}

/**
 * Sorts all the categories hierarchically by the `parentId`. It does this in
 * an interesting way. Let me explain...
 *
 * Here, no category knows whether there are more ancestor categories before
 * it's parent. So, we iterate through the `categories` array and add them one
 * by one in the tree. Before adding a category in the tree, it checks whether
 * it's parent is already in the tree, if not then it just adds a new mock
 * category in the tree with it's parent id and declares it as a **mock**. When
 * the parent comes later and sees that it's children has already added it as a
 * mock then it just replaces that mock with itself and removes the **isMock**
 * declaration.
 *
 * Illustration.
 *
 * ```js
 * const categories = [
 *  { name: "C", id: 3, pid: 1 },
 *  { name: "B", id: 2, pid: 1 },
 *  { name: "A", id: 1, pid: null },
 * ];
 * ```
 * The tree should look like:
 * ```
 *    A
 *   / \
 *  B   C
 * ```
 *
 * Now, let's add categories one by one. Our current tree is and empty object
 * (`{}`).
 *
 * ### Index: 0, Category: "C"
 * It finds that it's not in the category so it first adds itself. Now the tree
 * is:
 *
 * ```js
 * const tree = {
 *    3: { value: "<category C>", children: [] }
 * }
 * ```
 * Then it sees that it's parent (`id: 1`) doesn't exist in the tree so, it adds
 * a mock parent and pushes itself in it's parent's `children` array.
 *
 * ```js
 * const tree = {
 *    1: { value: {}, isMock: true, children: ["<tree[3]>"] },
 *    3: { value: "<category C>", children: [] },
 * };
 * ```
 *
 * ### Index: 1, Category: "B"
 * First adds itself and the tree becomes:
 *
 * ```js
 * const tree = {
 *    1: { value: {}, isMock: true, children: ["<tree[3]>"] },
 *    2: { value: "<category B>", children: [] },
 *    3: { value: "<category C>", children: [] },
 * };
 * ```
 * Then it sees that it's parent with `id 1` already exists so it just pushes
 * itself in it's parent's `children` array.
 *
 * ```js
 * const tree = {
 *    1: { value: {}, isMock: true, children: ["<tree[3]>", "<tree[2]>"] },
 *    2: { value: "<category B>", children: [] },
 *    3: { value: "<category C>", children: [] },
 * };
 * ```
 *
 * ### Index: 2, Category: A
 *
 * It comes and sees that it's children have already added a mock entry for it
 * and declared it as mock. So, it replaces the mock with itself and it assigns
 * `false` to is `isMock`.
 *
 * ```js
 * const tree = {
 *    1: { value: "<category A>", children: ["<tree[3]>", "<tree[2]>"] },
 *    2: { value: "<category B>", children: [] },
 *    3: { value: "<category C>", children: [] },
 * };
 * ```
 * Then it sees that it's `parentId` is `null` so it uses the tree's
 * `DEFAULT_ROOT_ID` as it's `parentId` and creates a mock entry for it. Then
 * pushes itself in the `children` array.
 *
 *```js
 * const tree = {
 *    [DEFAULT_ROOT_ID]: {value: {}, isMock: true, children: ["<tree[1]>"]}
 *    1: { value: "<category A>", children: ["<tree[3]>", "<tree[2]>"] },
 *    2: { value: "<category B>", children: [] },
 *    3: { value: "<category C>", children: [] },
 * };
 * ```
 *
 * Now, we check every branch of the tree to make sure that there is no
 * branch with `isMock` equal to `true` other than the `DEFAULT_ROOT_ID` because
 * otherwise the tree would be incomplete with missing branches.
 *
 * Finally, we return `tree[DEFAULT_ROOT_ID]` as the root node.
 * */
export function buildCategoryTree(categories: Category[]) {
  const tree: CategoryTree = {};
  const DEFAULT_ROOT_ID = Symbol();

  for (const category of categories) {
    const currentBranch: CategoryBranch = {
      value: category,
      children: [] as CategoryBranch[],
    };

    if (tree[category.id]) {
      // if my children already added me then
      currentBranch.children = tree[category.id].children;
      tree[category.id] = currentBranch;
    } else tree[category.id] = currentBranch;

    const parentId = category.parentId || DEFAULT_ROOT_ID;

    if (!tree[parentId]) {
      const parentBranch: CategoryBranch = {
        // @ts-ignore I know it's not allowed to be empty
        value: {},
        children: [],
        isMock: true,
      };

      tree[parentId] = parentBranch;
    }

    tree[parentId]!.children.push(currentBranch);
  }

  for (const [id, branch] of Object.entries(tree))
    if (branch.isMock && <any>id !== DEFAULT_ROOT_ID)
      throw new Error(
        `The tree is incomplete. Missing category with id: ${id}`
      );

  return tree[DEFAULT_ROOT_ID];
}
