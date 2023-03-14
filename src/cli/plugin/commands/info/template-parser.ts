export interface infoTemplateParser_Arg {
  varEnd: string;
  template: string;
  varStart: string;
  escapeChar: string;
}

interface Variable {
  name: string;
  index: number;
}

export type ParsedTemplate = { segments: string[]; variables: Variable[] };

function infoTemplateParser(arg: infoTemplateParser_Arg) {
  const { template, varEnd, varStart, escapeChar } = arg;

  if (!template) throw new Error(`The template cannot be an empty string.`);

  const segments: string[] = [];
  const variables: Variable[] = [];

  let isVar = false,
    currentVar = "",
    currentString = "",
    currentVarIndex: number,
    isEscapeSequence = false;

  for (let index = 0; index < template.length; index++) {
    const char = template[index];

    switch (char) {
      case varStart:
        if (isEscapeSequence) {
          currentString += char;
          isEscapeSequence = false;
        } else if (isVar)
          throw new Error(
            `Invalid char: ${char} at index: ${index}. The current variable hasn't been enclosed yet.`
          );
        else {
          segments.push(currentString);
          currentString = "";

          currentVarIndex = segments.length;
          segments.push(""); // the placeholder for current var's position

          isVar = true;
        }
        break;

      case varEnd:
        if (isEscapeSequence) {
          currentString += char;
          isEscapeSequence = false;
        } else if (!isVar)
          throw new Error(`Invalid char: "${char}" at index: ${index}.`);
        else {
          variables.push({ name: currentVar, index: currentVarIndex! });
          currentVar = "";

          isVar = false;
        }
        break;

      case escapeChar:
        if (isEscapeSequence) {
          currentString += char;
          isEscapeSequence = false;
        } else isEscapeSequence = true;
        break;

      default:
        if (isEscapeSequence)
          throw new Error(
            `Invalid escape sequence: "${escapeChar}${char}" at index ${index}`
          );

        if (isVar) currentVar += char;
        else currentString += char;
    }
  }

  if (currentString) segments.push(currentString);

  return { segments, variables };
}

export const parseInfoTemplate = (template: string) =>
  infoTemplateParser({ template, escapeChar: "%", varEnd: "]", varStart: "[" });
