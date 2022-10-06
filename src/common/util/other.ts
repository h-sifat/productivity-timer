import { createHash } from "crypto";

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
