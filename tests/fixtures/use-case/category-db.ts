import type { CategoryFields } from "entities/category/category";
import type CategoryDatabase from "use-cases/category/interfaces/category-db";

interface Store {
  [key: string]: Readonly<CategoryFields>;
}

type FakeCategoryDatabase = CategoryDatabase & {
  _clearDb_(): Store;
  _getStore_(): Store;
  _failNextQuery_(arg: {
    errCode?: string;
    errMessage: string;
    method: AllQueryMethods;
  }): void;
};

type AllQueryMethods = keyof CategoryDatabase;

type PlannedFailure = {
  [key in AllQueryMethods]: Error | null;
};

export function getCategoryDatabase(): FakeCategoryDatabase {
  let store: Store = {};

  // @ts-ignore
  const plannedFailure: PlannedFailure = {};

  const db: FakeCategoryDatabase = {
    async findChildren({ id, recursive = false }) {
      failDeliberatelyIfPlanned("findChildren");
      return findChildrenSync({ id, recursive });
    },

    async removeCategories({ ids }) {
      failDeliberatelyIfPlanned("removeCategories");

      const deleted = [];

      for (const id of ids)
        if (id in store) {
          deleted.push(store[id]);
          delete store[id];
        }

      return deleted;
    },

    async insert({ categoryInfo }) {
      failDeliberatelyIfPlanned("insert");

      const object = Object.freeze(categoryInfo);
      store[categoryInfo.id] = object;
      return object;
    },

    async findById({ id }) {
      failDeliberatelyIfPlanned("findById");
      return store[id] || null;
    },

    async findByHash({ hash }) {
      failDeliberatelyIfPlanned("findByHash");

      const category = Object.values(store).find((cat) => cat.hash === hash);
      return category || null;
    },

    async findAll() {
      failDeliberatelyIfPlanned("findAll");

      return Object.values(store);
    },

    _clearDb_() {
      store = {};
      return store;
    },

    _failNextQuery_(arg) {
      const { method, errMessage } = arg;
      plannedFailure[method] = new Error(errMessage);

      // @ts-expect-error
      if ("errCode" in arg) plannedFailure[method].code = arg.errCode;
    },

    _getStore_() {
      return store;
    },
  };

  return Object.freeze(db);

  function findChildrenSync(arg: {
    id: string;
    recursive: boolean;
  }): CategoryFields[] {
    const { id, recursive } = arg;

    const subCategories: CategoryFields[] = [];

    for (const category of Object.values(store)) {
      if (category.parentId !== id) continue;

      subCategories.push(category);

      if (recursive)
        subCategories.push(...findChildrenSync({ id: category.id, recursive }));
    }

    return subCategories;
  }

  function failDeliberatelyIfPlanned(methodName: AllQueryMethods) {
    if (plannedFailure[methodName]) {
      const error = plannedFailure[methodName];
      plannedFailure[methodName] = null;
      throw error;
    }
  }
}
