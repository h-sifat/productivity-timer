import { createHash } from "crypto";

export function createMD5Hash(arg: string): string {
  return createHash("md5").update(String(arg)).digest("hex");
}
