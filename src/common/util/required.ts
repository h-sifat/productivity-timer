import EPP from "./epp";

export default function required(property: string, code?: string) {
  if (!code) code = `MISSING_${property.toUpperCase()}`;
  throw new EPP(`The property "${property}" is missing.`, code);
}
