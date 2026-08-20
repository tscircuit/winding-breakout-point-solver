import type { GraphicsObject } from "graphics-debug"
import { getCanonicalConnections } from "../input/get-canonical-connections"
import type {
  WindingBreakoutOutput,
  WindingBreakoutSolverInput,
} from "../types"
import { getConnectionColor } from "./get-connection-color"
import { getGraphicsLayer } from "./get-graphics-layer"

/** Draw only the calculated breakout points; this solver does not route. */
export const createStateGraphics = (
  input: WindingBreakoutSolverInput,
  state: WindingBreakoutOutput,
  activeLayer?: string,
): GraphicsObject => {
  const connections = getCanonicalConnections(input)
  const breakoutPoints = state.breakoutPoints.filter(
    (point) => !activeLayer || point.layer === activeLayer,
  )
  const guideLines = state.referenceOrder.flatMap((connectionId) => {
    const connection = connections.find(
      (candidate) => candidate.id === connectionId,
    )
    if (!connection || (activeLayer && connection.layer !== activeLayer))
      return []
    const connectionBreakouts = breakoutPoints.filter(
      (point) => point.connectionId === connectionId,
    )
    if (connectionBreakouts.length !== input.regions.length) return []
    const points = input.regions.flatMap((region, regionIndex) => {
      const endpoint = connection.endpoints.find(
        (candidate) => candidate.regionId === region.id,
      )
      const breakout = connectionBreakouts.find(
        (candidate) => candidate.regionId === region.id,
      )
      if (!endpoint || !breakout) return []
      return regionIndex === 0
        ? [endpoint.position, breakout]
        : [breakout, endpoint.position]
    })
    if (points.length < 4) return []
    return [
      {
        points,
        strokeColor: `${getConnectionColor(connectionId)}55`,
        strokeWidth: 0.012,
        strokeDash: [0.025, 0.07],
        layer: getGraphicsLayer(input, [connection.layer]),
      },
    ]
  })
  return {
    lines: guideLines,
    circles: state.sharedGateSlots.flatMap((slot) => {
      const layers = slot.indicators
        .map((indicator) => indicator.layer)
        .filter((layer) => !activeLayer || layer === activeLayer)
      if (layers.length === 0) return []
      return [
        {
          center: slot,
          radius: 0.11,
          fill: "rgba(15, 23, 42, 0.06)",
          stroke: "#475569",
          layer: getGraphicsLayer(input, layers),
        },
      ]
    }),
    points: breakoutPoints.map((point) => ({
      x: point.x,
      y: point.y,
      color: getConnectionColor(point.connectionId),
      label: `${point.connectionId} · ${point.layer}`,
      layer: getGraphicsLayer(input, [point.layer]),
    })),
  }
}
