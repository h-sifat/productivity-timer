import { DeepFreeze, DeepFreezeTypeMapper } from "common/interfaces/other";
import { createHash } from "crypto";
import { is } from "handy-types";

export function createMD5Hash(arg: string): string {
  return createHash("md5").update(String(arg)).digest("hex");
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
  // @ts-ignore
  if (!is<object>("non_null_object", object)) return object;

  if (Array.isArray(object))
    // @ts-ignore
    return Object.freeze(object.map((element) => deepFreeze(element)));

  for (const [property, value] of Object.entries(object))
    (object as any)[property] = deepFreeze(value);

  // @ts-ignore
  return Object.freeze(object);
}
