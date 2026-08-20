import type {
  ValidatedConnection,
  ValidatedRegion,
} from "../input/validate-winding-breakout-input"

export const getNaturalWindingOrder = (
  region: ValidatedRegion,
  connections: readonly ValidatedConnection[],
): string[] =>
  connections
    .map((connection) => {
      const position = connection.endpoints.find(
        (endpoint) => endpoint.regionId === region.id,
      )!.position
      return {
        id: connection.id,
        angle: Math.atan2(
          position.y - region.center.y,
          position.x - region.center.x,
        ),
        radius: Math.hypot(
          position.x - region.center.x,
          position.y - region.center.y,
        ),
      }
    })
    .sort(
      (first, second) =>
        first.angle - second.angle ||
        second.radius - first.radius ||
        first.id.localeCompare(second.id),
    )
    .map((connection) => connection.id)
