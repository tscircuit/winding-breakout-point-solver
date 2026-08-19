import type { WindingBreakoutRegion } from "../types"

export const getNaturalWindingOrder = (
  region: WindingBreakoutRegion,
): string[] =>
  region.ports
    .map((port) => ({
      id: port.connectionId,
      angle: Math.atan2(
        port.position.y - region.center.y,
        port.position.x - region.center.x,
      ),
      radius: Math.hypot(
        port.position.x - region.center.x,
        port.position.y - region.center.y,
      ),
    }))
    .sort(
      (first, second) =>
        first.angle - second.angle ||
        second.radius - first.radius ||
        first.id.localeCompare(second.id),
    )
    .map((port) => port.id)
