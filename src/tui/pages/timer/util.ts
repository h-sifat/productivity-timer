import type { TimerRefFromForm } from "./timer-form";

const nameOrIdAbbreviation = Object.freeze({ n: "name", i: "id" });
const refTypeAbbreviation = Object.freeze({ c: "category", p: "project" });

export function getRefObjectFromRefInput(
  value: string
): TimerRefFromForm | null {
  value = value.trim();
  if (value.length < 3) return null;

  // ci, cn, pi, pn
  const refStr = value.slice(0, 2);
  // any input after the "[cp][in]/"
  const identifier = value.slice(3);

  return {
    identifier,
    type: refTypeAbbreviation[refStr[0] as "c" | "p"],
    identifierType: nameOrIdAbbreviation[refStr[1] as "n" | "i"],
  };
}
