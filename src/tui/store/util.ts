import type { IdToIndexMap } from "./interface";

export function createIdToIndexMap(
  objects: { readonly id: string }[]
): IdToIndexMap {
  return objects.reduce((map, object, index) => {
    map[object.id] = index;
    return map;
  }, {} as IdToIndexMap);
}
