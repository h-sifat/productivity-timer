type DEFAULT_CONFIG = Readonly<{
  category: Readonly<{
    MAX_NAME_LENGTH: number;
    MAX_DESCRIPTION_LENGTH: number;
  }>;
  project: Readonly<{
    MAX_NAME_LENGTH: number;
    MAX_DESCRIPTION_LENGTH: number;
    MIN_HOUR_BEFORE_DEADLINE: number;
  }>;
}>;

const defaults: DEFAULT_CONFIG = Object.freeze({
  category: Object.freeze({
    MAX_NAME_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 120,
  }),
  project: Object.freeze({
    MAX_NAME_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 120,
    MIN_HOUR_BEFORE_DEADLINE: 1,
  }),
});

export function getDefaultConfig<EntityName extends keyof DEFAULT_CONFIG>(arg: {
  entity: EntityName;
}) {
  const { entity } = arg;

  return defaults[entity] as DEFAULT_CONFIG[EntityName];
}
