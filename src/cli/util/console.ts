export function getPieRadius() {
  const [width] = process.stdout.getWindowSize();

  if (width <= 50) return 4;
  if (width <= 70) return 5;
  return 7;
}
