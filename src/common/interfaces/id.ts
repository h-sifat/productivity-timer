export type ID = Readonly<{
  isValid(id: string): boolean;
  makeId(): string;
}>;
