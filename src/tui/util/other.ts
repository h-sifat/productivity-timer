import type { Widgets } from "blessed";
import { pick } from "common/util/other";
import type { ElementDimension, ElementPosition } from "tui/interface";

export function pickDimensionalProps(
  dimension: ElementDimension = {}
): ElementDimension {
  return pick(dimension, ["width", "height"]);
}

export function pickPositionalProps(
  position: ElementPosition = {}
): ElementPosition {
  return pick(position, ["top", "bottom", "left", "right"]);
}

export function disableClick(element: Widgets.Node) {
  if (!element.children.length) return;

  for (const child of element.children) {
    (child as any).clickable = false;

    disableClick(child as any);
  }
}
