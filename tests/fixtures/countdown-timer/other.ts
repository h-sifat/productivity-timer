interface GetSeries_Argument {
  initialValue?: number;
  incrementBy: number;
}
export default function getSeries(arg: GetSeries_Argument) {
  let currentValue = arg.initialValue || Date.now();

  return Object.freeze({
    get currentValue() {
      return currentValue;
    },
    next: () => (currentValue += arg.incrementBy),
  });
}
