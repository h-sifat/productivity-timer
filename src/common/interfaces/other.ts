export type DeepFreezeTypeMapper<Type extends object> = {
  readonly [key in keyof Type]: Type[key] extends object
    ? DeepFreezeTypeMapper<Type[key]>
    : Type[key];
};

export type DeepFreeze = <Type>(
  object: Type
) => Type extends object ? DeepFreezeTypeMapper<Type> : Type;

export type Notify = (message: string) => void;

export type PickObject = <O extends object, K extends Array<keyof O>>(
  object: O,
  keys: K
) => Pick<O, K[number]>;
