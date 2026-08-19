import type { GraphicsObject } from "graphics-debug"
import type {
  WindingBreakoutDiagnosticOutput,
  WindingBreakoutOutput,
  WindingBreakoutSolverInput,
} from "../types"
import { getConnectionColor } from "./get-connection-color"
import { getGraphicsLayer } from "./get-graphics-layer"

/** Draw only the calculated breakout points; this solver does not route. */
export const createStateGraphics = (
  input: WindingBreakoutSolverInput,
  state: WindingBreakoutOutput | WindingBreakoutDiagnosticOutput,
  activeLayer?: string,
): GraphicsObject => {
  const diagnostic = state.solved === false
  const breakoutPoints = state.breakoutPoints.filter(
    (point) => !activeLayer || point.layer === activeLayer,
  )
  const guideLines = state.referenceOrder.flatMap((connectionId) => {
    const connectionBreakouts = breakoutPoints.filter(
      (point) => point.connectionId === connectionId,
    )
    if (connectionBreakouts.length !== input.regions.length) return []
    const points = input.regions.flatMap((region, regionIndex) => {
      const port = region.ports.find(
        (candidate) => candidate.connectionId === connectionId,
      )
      const breakout = connectionBreakouts.find(
        (candidate) => candidate.regionId === region.id,
      )
      if (!port || !breakout) return []
      return regionIndex === 0
        ? [port.position, breakout]
        : [breakout, port.position]
    })
    if (points.length < 4) return []
    const layer = connectionBreakouts[0]!.layer
    return [
      {
        points,
        strokeColor: diagnostic
          ? "rgba(220, 38, 38, 0.32)"
          : `${getConnectionColor(connectionId)}55`,
        strokeWidth: 0.012,
        strokeDash: [0.025, 0.07],
        layer: getGraphicsLayer(input, [layer]),
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
          fill: diagnostic
            ? "rgba(220, 38, 38, 0.12)"
            : "rgba(15, 23, 42, 0.06)",
          stroke: diagnostic ? "#dc2626" : "#475569",
          layer: getGraphicsLayer(input, layers),
        },
      ]
    }),
    points: breakoutPoints.map((point) => ({
      x: point.x,
      y: point.y,
      color: diagnostic ? "#dc2626" : getConnectionColor(point.connectionId),
      label: `${point.connectionId} · ${point.layer}`,
      layer: getGraphicsLayer(input, [point.layer]),
    })),
  }
}
