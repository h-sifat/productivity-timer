import EPP from "./epp";

export default function required(
  property: string,
  code: string = "MISSING_PROPERTY"
) {
  throw new EPP(`The property "${property}" is missing.`, code);
}
