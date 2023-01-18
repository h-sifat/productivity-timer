import makeHasher from "node-object-hash";

const hasher = makeHasher({ sort: true, coerce: false, alg: "md5" });

export function hashObject(object: any): string {
  return hasher.hash(object);
}
