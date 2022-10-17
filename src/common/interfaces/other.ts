export type DeepFreezeTypeMapper<Type extends object> = {
  readonly [key in keyof Type]: Type[key] extends object
    ? DeepFreezeTypeMapper<Type[key]>
    : Type[key];
};

export type DeepFreeze = <Type extends object>(
  object: Type
) => DeepFreezeTypeMapper<object>;
