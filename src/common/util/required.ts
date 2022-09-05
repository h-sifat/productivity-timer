import EPP from "./epp";

export default function required(property: string) {
  throw new EPP(`The property "${property}" is missing.`, "MISSING_PROPERTY");
}
