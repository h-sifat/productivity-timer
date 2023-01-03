import { createHash } from "crypto";
import { DeepFreezeTypeMapper, PickObject } from "common/interfaces/other";

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
