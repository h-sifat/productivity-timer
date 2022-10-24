import EPP from "./epp";

type Required_OptionalArgument =
  | string
  | { code?: string; objectName?: string };

export default function required<Type>(
  property: string,
  codeOrInfoObject: Required_OptionalArgument = {}
): Type {
  const { code, objectName } = (() => {
    if (typeof codeOrInfoObject === "string")
      return { code: codeOrInfoObject, objectName: undefined };
    const code =
      "code" in codeOrInfoObject
        ? codeOrInfoObject.code
        : `MISSING_${property.toUpperCase()}`;
    return { code, objectName: codeOrInfoObject.objectName };
  })();

  let message = `The property "${property}" is missing`;
  if (objectName) message += ` from ${objectName}`;
  message += ".";

  throw new EPP(message, code);
}
