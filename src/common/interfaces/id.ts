export type ID = Readonly<{
  isValid(id: any): id is string;
  makeId(): string;
}>;
