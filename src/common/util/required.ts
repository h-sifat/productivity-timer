import EPP from "./epp";

export default function required<Type>(property: string, code?: string): Type {
  if (!code) code = `MISSING_${property.toUpperCase()}`;
  throw new EPP(`The property "${property}" is missing.`, code);
}
