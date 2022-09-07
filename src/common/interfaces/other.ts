export type ToPlainObject<ReturnType extends object> =
  () => Readonly<ReturnType>;
