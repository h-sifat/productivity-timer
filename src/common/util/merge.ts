import { merge as _merge } from "lodash";

export function merge<TObject, TSource>(
  object: TObject,
  source: TSource
): TObject & TSource;
export function merge<TObject, TSource1, TSource2>(
  object: TObject,
  source1: TSource1,
  source2: TSource2
): TObject & TSource1 & TSource2;
export function merge<TObject, TSource1, TSource2, TSource3>(
  object: TObject,
  source1: TSource1,
  source2: TSource2,
  source3: TSource3
): TObject & TSource1 & TSource2 & TSource3;
export function merge<TObject, TSource1, TSource2, TSource3, TSource4>(
  object: TObject,
  source1: TSource1,
  source2: TSource2,
  source3: TSource3,
  source4: TSource4
): TObject & TSource1 & TSource2 & TSource3 & TSource4;
export function merge(object: any, ...otherArgs: any[]): any {
  return _merge(object, ...otherArgs);
}
