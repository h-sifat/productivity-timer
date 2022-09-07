const defaults = {
  category: Object.freeze({
    MAX_NAME_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 100,
  }),
} as const;

interface GetDefaultConfig_Argument {
  entity: "category";
}

export function getDefaultConfig(arg: GetDefaultConfig_Argument) {
  const { entity } = arg;

  return defaults[entity];
}
