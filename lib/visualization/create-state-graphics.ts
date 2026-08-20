import type { GraphicsObject } from "graphics-debug"
import { getCanonicalConnections } from "../input/get-canonical-connections"
import type { BreakoutPoint, WindingBreakoutSolverInput } from "../types"
import { getConnectionColor } from "./get-connection-color"
import { getGraphicsLayer } from "./get-graphics-layer"

/** Draw only the calculated breakout points; this solver does not route. */
export interface WindingBreakoutVisualizationState {
  readonly referenceOrder: readonly string[]
  readonly breakoutPoints: readonly BreakoutPoint[]
}

export const createStateGraphics = (
  input: WindingBreakoutSolverInput,
  state: WindingBreakoutVisualizationState,
  activeLayer?: string,
): GraphicsObject => {
  const connections = getCanonicalConnections(input)
  const breakoutPoints = state.breakoutPoints.filter(
    (point) => !activeLayer || point.layer === activeLayer,
  )
  const sharedGateSlots = new Map<
    string,
    { readonly x: number; readonly y: number; readonly layers: Set<string> }
  >()
  for (const point of state.breakoutPoints) {
    const key = `${point.regionId}:${point.x.toFixed(9)}:${point.y.toFixed(9)}`
    const slot = sharedGateSlots.get(key) ?? {
      x: point.x,
      y: point.y,
      layers: new Set<string>(),
    }
    slot.layers.add(point.layer)
    sharedGateSlots.set(key, slot)
  }
  const guideLines = state.referenceOrder.flatMap((connectionId) => {
    const connection = connections.find(
      (candidate) => candidate.id === connectionId,
    )
    if (!connection) return []
    const connectionBreakouts = breakoutPoints.filter(
      (point) => point.connectionId === connectionId,
    )
    const layer = connectionBreakouts[0]?.layer
    if (!layer || (activeLayer && layer !== activeLayer)) return []
    if (connectionBreakouts.length !== input.regions.length) return []
    const points = input.regions.flatMap((region, regionIndex) => {
      const endpoint = connection.endpoints.find(
        (candidate) => candidate.regionId === region.id,
      )
      const breakout = connectionBreakouts.find(
        (candidate) => candidate.regionId === region.id,
      )
      if (!endpoint || !breakout) return []
      if (regionIndex === 0) return [endpoint.position, breakout]
      return [breakout, endpoint.position]
    })
    if (points.length < 2) return []
    return [
      {
        points,
        strokeColor: `${getConnectionColor(connectionId)}55`,
        strokeWidth: 0.012,
        strokeDash: [0.025, 0.07],
        layer: getGraphicsLayer(input, [layer]),
      },
    ]
  })
  return {
    lines: guideLines,
    circles: [...sharedGateSlots.values()].flatMap((slot) => {
      const layers = [...slot.layers].filter(
        (layer) => !activeLayer || layer === activeLayer,
      )
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
