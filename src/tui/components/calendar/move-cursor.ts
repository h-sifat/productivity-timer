import { Coordinate } from "./interface";
import { getCircularArrayIndex } from "common/util/other";

export type ScrollDirection = "up" | "down" | "left" | "right";

export interface movePointInMatrix_Argument {
  numOfRows: number;
  numOfColumns: number;

  step: number;
  direction: ScrollDirection;
  point: Readonly<Coordinate>;
}

/**
 * ## Horizontal movement behavior
 * **Direction: Left**
 * If point.x - step > 0, then change point.x = point.x - step. Otherwise keep
 * moving to previous rows.
 *
 * **Direction: Right**
 * If point.x + step < numOfColumns - 1, change then point.x = point.x + step.
 * Otherwise keep moving to next rows.
 *
 * ## Vertical movement behavior
 * Imagines the current column as a circular array and increments the point.y
 * */
export function movePointInMatrix(arg: movePointInMatrix_Argument) {
  const { direction, numOfColumns, numOfRows, step, point } = arg;
  const offset = direction === "down" || direction === "right" ? step : -step;

  if (direction === "up" || direction === "down") {
    const newY = getCircularArrayIndex({
      offset,
      index: point.y,
      length: numOfRows,
    });

    return { x: point.x, y: newY };
  }

  // direction = "left" or "right"
  const newX = getCircularArrayIndex({
    offset,
    index: point.x,
    length: numOfColumns,
  });

  const sideEffectYStep = Math.floor((point.x + offset) / numOfColumns);

  const newY = getCircularArrayIndex({
    index: point.y,
    length: numOfRows,
    offset: sideEffectYStep,
  });

  return { x: newX, y: newY };
}
