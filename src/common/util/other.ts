import { createHash } from "crypto";
import { DeepFreezeTypeMapper, PickObject } from "common/interfaces/other";
import { cloneDeep as lodash_cloneDeep } from "lodash";
import { Writable } from "type-fest";

export function createMD5Hash(arg: string): string {
  return createHash("md5").update(String(arg)).digest("base64");
}

export function makeReadonlyProxy<Type extends object>(object: Type): Type {
  return new Proxy(object, {
    get(_, property) {
      // @ts-ignore
      return property in object ? object[property] : undefined;
    },
    set(_, _p, value) {
      return value;
    },
  });
}

export function deepFreeze<Type>(
  object: Type
): Type extends object ? DeepFreezeTypeMapper<Type> : Type {
  {
    const freezable =
      (typeof object === "object" || typeof object === "function") &&
      object !== null;

    if (!freezable) return object as any;
  }

  if (!Object.isFrozen(object)) Object.freeze(object);
  for (const key of Object.keys(object)) deepFreeze((<any>object)[key]);

  return object as any;
}

export function isEmptyObject(object: any) {
  for (const _key in object) return false;
  return true;
}

export const pick: PickObject = function _pick(object, keys) {
  return keys.reduce((pickedObject, key) => {
    pickedObject[key] = object[key];
    return pickedObject;
  }, Object.create(null));
};

export const cloneDeep = <T>(o: T): Writable<T> => lodash_cloneDeep(o);

export interface getCircularArrayIndex_Arg {
  offset: number;
  length: number;
  index: number;
}

/**
 *
 * */
export function getCircularArrayIndex(arg: getCircularArrayIndex_Arg) {
  const { index, length, offset } = arg;
  if (offset >= 0) return (index + offset) % length;

  /**
   * Formula:
   * newIndex = maxIndex - ((inverseIndex + Math.abs(offset)) % length)
   *                       (--------------New Inverse Index---------------)
   *            (----------New Real Index---------------------------------)
   *
   * array:        [a, b, c, d]
   * index:         0, 1, 2, 3
   * inverseIndex:  3, 2, 1, 0 (maxIndex - index)
   *
   * Example: index: 2, offset: -3, length: 4
   * newIndex = (4 - 1) - ((4 - 1 - 2 - -3) % 4)
   *          = 3 - ((4 - 3 + 3) % 4)
   *          = 3 - (4 % 4)
   *          = 3 - 0
   *          = 3
   * */
  return (
    length - 1 - ((length - 1 - index - offset) % length)
    //-maxIndex--|    |-------Inverse Index--------|
  );
}
