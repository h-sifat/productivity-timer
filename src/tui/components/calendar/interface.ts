export interface DayNameInterface {
  index: number;
  name: { short: string; medium: string; long: string };
}

export type DateMatrixOfMonth = (Date | null)[][];
