interface MakeTimestampsFixtureArgument {
  creationTimestampPropName: string;
  modificationTimestampPropName: string;
}

export default function makeTimestampsFixture(
  arg: MakeTimestampsFixtureArgument
) {
  const { creationTimestampPropName, modificationTimestampPropName } = arg;

  const properties = Object.freeze([
    creationTimestampPropName,
    modificationTimestampPropName,
  ]);

  return function timestampsFixture(override: any = {}) {
    const defaults = {
      [creationTimestampPropName]: 100,
      [modificationTimestampPropName]: 200,
    };

    for (const property of properties)
      if (property in override)
        // @ts-ignore
        defaults[property] = override[property];

    return defaults;
  };
}
