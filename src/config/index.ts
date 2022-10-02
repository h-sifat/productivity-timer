type DEFAULT_CONFIG = Readonly<{
  category: Readonly<{
    MAX_NAME_LENGTH: number;
    VALID_NAME_PATTERN: RegExp;
    MAX_DESCRIPTION_LENGTH: number;
    MSG_NAME_DOES_NOT_MATCH_PATTERN: string;
  }>;
  project: Readonly<{
    MAX_NAME_LENGTH: number;
    VALID_NAME_PATTERN: RegExp;
    MAX_DESCRIPTION_LENGTH: number;
    MIN_HOUR_BEFORE_DEADLINE: number;
    MSG_NAME_DOES_NOT_MATCH_PATTERN: string;
  }>;
}>;

const defaults: DEFAULT_CONFIG = Object.freeze({
  category: Object.freeze({
    MAX_NAME_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 120,
    VALID_NAME_PATTERN: /^[\w_ .-]+$/,
    MSG_NAME_DOES_NOT_MATCH_PATTERN:
      "Category.name must only contain alphanumeric, '_', ' ', '.', and '-' characters.",
  }),
  project: Object.freeze({
    MAX_NAME_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 120,
    MIN_HOUR_BEFORE_DEADLINE: 1,
    VALID_NAME_PATTERN: /^[\w_ .-]+$/,
    MSG_NAME_DOES_NOT_MATCH_PATTERN:
      "Project.name must only contain alphanumeric, '_', ' ', '.', and '-' characters.",
  }),
});

export function getDefaultEntityConfig<
  EntityName extends keyof DEFAULT_CONFIG
>(arg: { entity: EntityName }) {
  const { entity } = arg;

  return defaults[entity] as DEFAULT_CONFIG[EntityName];
}
