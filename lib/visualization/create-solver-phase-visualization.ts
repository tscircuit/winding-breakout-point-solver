import type { GraphicsObject } from "graphics-debug"
import { getLayerNames } from "../get-layer-names"
import { getCanonicalConnections } from "../input/get-canonical-connections"
import type { WindingBreakoutSolverInput } from "../types"
import { createInputGraphics } from "./create-input-graphics"
import {
  createStateGraphics,
  type WindingBreakoutVisualizationState,
} from "./create-state-graphics"
import { getConnectionColor } from "./get-connection-color"
import { getGraphicsLayer } from "./get-graphics-layer"

export const createSolverPhaseVisualization = ({
  input,
  phase,
  detail,
  activeLayer,
  referenceOrder,
  referenceRegionId,
  showReferenceNumbers = false,
  state,
}: {
  input: WindingBreakoutSolverInput
  phase: string
  detail: string
  activeLayer?: string
  referenceOrder?: readonly string[]
  referenceRegionId?: string
  showReferenceNumbers?: boolean
  state?: WindingBreakoutVisualizationState
}): GraphicsObject => {
  const inputGraphics = createInputGraphics(input, activeLayer)
  const stateGraphics = state
    ? createStateGraphics(input, state, activeLayer)
    : undefined
  const displayedLayers = activeLayer ? [activeLayer] : getLayerNames(input)
  const textLayer = getGraphicsLayer(input, displayedLayers)
  const maxY = Math.max(...input.regions.map((region) => region.bounds.maxY))
  const minX = Math.min(...input.regions.map((region) => region.bounds.minX))
  const texts = [
    ...(inputGraphics.texts ?? []),
    ...(stateGraphics?.texts ?? []),
    {
      x: minX,
      y: maxY + 1.05,
      text: phase,
      anchorSide: "bottom_left" as const,
      color: "#0f172a",
      fontSize: 0.42,
      layer: textLayer,
    },
    {
      x: minX,
      y: maxY + 0.68,
      text: detail,
      anchorSide: "bottom_left" as const,
      color: "#475569",
      fontSize: 0.25,
      layer: textLayer,
    },
  ]
  const referenceLines: NonNullable<GraphicsObject["lines"]> = []
  const referenceCircles: NonNullable<GraphicsObject["circles"]> = []

  if (showReferenceNumbers && referenceOrder) {
    const referenceRegion =
      input.regions.find((region) => region.id === referenceRegionId) ??
      input.regions[0]!
    const connections = getCanonicalConnections(input)
    const orderedPositions: Array<{ x: number; y: number }> = []
    for (const [index, connectionId] of referenceOrder.entries()) {
      const connection = connections.find(
        (candidate) => candidate.id === connectionId,
      )
      if (!connection || (activeLayer && connection.layer !== activeLayer)) {
        continue
      }
      const endpoint = connection.endpoints.find(
        (candidate) => candidate.regionId === referenceRegion.id,
      )
      if (!endpoint) continue
      orderedPositions.push(endpoint.position)
      texts.push({
        x: endpoint.position.x + 0.18,
        y: endpoint.position.y + 0.18,
        text: `${index + 1} · ${connectionId}`,
        anchorSide: "bottom_left",
        color: getConnectionColor(connectionId),
        fontSize: 0.21,
        layer: getGraphicsLayer(input, [connection.layer]),
      })
    }
    const center = {
      x: (referenceRegion.bounds.minX + referenceRegion.bounds.maxX) / 2,
      y: (referenceRegion.bounds.minY + referenceRegion.bounds.maxY) / 2,
    }
    referenceLines.push(
      ...orderedPositions.map((position) => ({
        points: [center, position],
        strokeColor: "rgba(100, 116, 139, 0.35)",
        strokeWidth: 0.01,
        strokeDash: [0.03, 0.05],
        layer: textLayer,
      })),
    )
    if (orderedPositions.length > 1) {
      referenceLines.push({
        points: orderedPositions,
        strokeColor: "rgba(15, 23, 42, 0.65)",
        strokeWidth: 0.018,
        strokeDash: [0.04, 0.04],
        label: `${referenceRegion.id} angular winding order`,
        layer: textLayer,
      })
    }
    referenceCircles.push({
      center,
      radius: 0.07,
      fill: "#0f172a",
      stroke: "#ffffff",
      label: `${referenceRegion.id} angular reference center`,
      layer: textLayer,
    })
  }

  return {
    title: phase,
    coordinateSystem: "cartesian",
    rects: inputGraphics.rects,
    polygons: inputGraphics.polygons,
    lines: [...(stateGraphics?.lines ?? []), ...referenceLines],
    circles: [
      ...(inputGraphics.circles ?? []),
      ...(stateGraphics?.circles ?? []),
      ...referenceCircles,
    ],
    points: stateGraphics?.points,
    texts,
  }
}
