import colors from "ansi-colors";

export interface printObjectAsBox_Argument {
  object: object;
  title?: string;
  useColors?: boolean;
}
export async function printObjectAsBox(arg: printObjectAsBox_Argument) {
  const { object, useColors = true } = arg;

  const keyValuePair = Object.entries(object);
  const maxKeyNameLength = keyValuePair.reduce(
    (maxLength, [key]) => Math.max(maxLength, key.length),
    -Infinity
  );

  keyValuePair.sort(([kA, vA], [kB, vB]) => {
    const diff = String(vA).length - String(vB).length;
    // if both has the same length then sort by the key fields
    return diff ? diff : kA.length - kB.length;
  });

  let content = "";
  keyValuePair.forEach(([key, value], index) => {
    if (value === undefined) return;

    if (index) content += "\n";

    let formattedKey = key + ": ";
    let formattedValue = String(value);

    if (useColors) {
      formattedKey = colors.green(formattedKey);
      formattedValue = colors.white(formattedValue);
    }

    content += `${formattedKey}${" ".repeat(
      maxKeyNameLength - key.length
    )}${formattedValue}`;
  });

  const { default: boxen } = await import("boxen");

  let boxStyle: any = {
    padding: 1,
    borderStyle: "round",
  };

  if ("title" in arg) {
    boxStyle.title = arg.title;
    boxStyle.titleAlignment = "center";
  }

  const box = boxen(content, boxStyle);

  console.log(box);
}
