import Fuse from "fuse.js";
import { pick, cloneDeep } from "common/util/other";
import type { TimerRefFromForm } from "./timer-form";
import type { ProjectFields } from "entities/project/project";
import type { CategoryFields } from "entities/category/category";

const searchKeys = Object.freeze(["name"]);
const selectedKeys = Object.freeze(["name", "id"]) as ["name", "id"];

function getFuseOptions() {
  return {
    shouldSort: true,
    keys: [...searchKeys],
  };
}

function documentMapper(document: any) {
  return pick(document, selectedKeys);
}

export type GetTimerFormSuggestions = (
  ref: TimerRefFromForm,
  options?: { exactMatch?: boolean }
) => { name: string; id: string }[];

type AllFuses = {
  project: Fuse<ProjectFields>;
  category: Fuse<CategoryFields>;
};

export class SuggestionsProvider {
  readonly #fuses: AllFuses = {
    project: new Fuse([], getFuseOptions()),
    category: new Fuse([], getFuseOptions()),
  };

  getSuggestions = (
    ref: TimerRefFromForm,
    options: { exactMatch?: boolean } = {}
  ): { name: string; id: string }[] => {
    if (!ref.identifier.length)
      return <any[]>this.#getDocuments(ref.type).map(documentMapper);

    if (ref.identifierType === "name") {
      if (options.exactMatch) {
        const documents = <any[]>(
          this.#getDocuments(ref.type).map(documentMapper)
        );
        return documents.filter((document) => document.name === ref.identifier);
      }

      const suggestions = this.#fuses[ref.type].search(ref.identifier);
      return suggestions.map(({ item }) => pick(item, selectedKeys));
    }

    // ref.identifierType = id
    const documents = <any[]>this.#getDocuments(ref.type).map(documentMapper);
    return documents.filter((document) => document.id === ref.identifier);
  };

  update(arg: { project?: ProjectFields[]; category?: CategoryFields[] }) {
    if (arg.project) this.#fuses.project.setCollection(arg.project);
    if (arg.category) this.#fuses.category.setCollection(arg.category);
  }

  #getDocuments<T extends TimerRefFromForm["type"]>(
    type: T
  ): T extends "category" ? CategoryFields[] : ProjectFields[] {
    // @ts-expect-error undocumented feature
    return cloneDeep(this.#fuses[type].getIndex().docs);
  }
}
