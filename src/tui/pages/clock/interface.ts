export interface CanvasContext {
  stroke(): void;
  beginPath(): void;
  closePath(): void;
  lineTo(x: number, y: number): void;
  arc(
    x: number,
    y: number,
    r: number,
    startAngle: number,
    endAngle: number
  ): void;
  toString(): string;

  get width(): number;
  get height(): number;

  clearRect(x: number, y: number, width: number, height: number): void;
}

export interface Coordinate {
  x: number;
  y: number;
}
