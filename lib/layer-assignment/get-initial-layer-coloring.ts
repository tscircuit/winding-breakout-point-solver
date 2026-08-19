import type { StackupEntry } from "../types"
import type { WindingConflictGraph } from "./build-winding-conflict-graph"
import type { LayerColoringResult } from "./find-layer-coloring"
import { hasSolidPlaneBetween } from "./stackup-relationships"

/** Accept complete layer hints only when they satisfy every coloring invariant. */
export const getInitialLayerColoring = ({
  connectionIds,
  layerNames,
  hints,
  graph,
  electricalGraph,
  coupledGroups,
  stackup,
}: {
  connectionIds: readonly string[]
  layerNames: readonly string[]
  hints?: Readonly<Record<string, string>>
  graph: WindingConflictGraph
  electricalGraph: WindingConflictGraph
  coupledGroups: readonly (readonly string[])[]
  stackup: readonly StackupEntry[]
}): LayerColoringResult | null => {
  if (
    !hints ||
    !connectionIds.every(
      (connectionId) =>
        hints[connectionId] !== undefined &&
        layerNames.includes(hints[connectionId]!),
    )
  ) {
    return null
  }
  const colorByConnection = new Map(
    connectionIds.map((connectionId) => [
      connectionId,
      layerNames.indexOf(hints[connectionId]!),
    ]),
  )
  for (const group of coupledGroups) {
    if (
      new Set(group.map((member) => colorByConnection.get(member))).size !== 1
    ) {
      return null
    }
  }
  for (const [connectionId, neighbors] of graph) {
    if (
      [...neighbors].some(
        (neighbor) =>
          colorByConnection.get(connectionId) ===
          colorByConnection.get(neighbor),
      )
    ) {
      return null
    }
  }
  for (const [connectionId, neighbors] of electricalGraph) {
    const color = colorByConnection.get(connectionId)!
    for (const neighbor of neighbors) {
      const neighborColor = colorByConnection.get(neighbor)!
      if (color === neighborColor) continue
      if (
        !hasSolidPlaneBetween(
          stackup,
          layerNames[color]!,
          layerNames[neighborColor]!,
        )
      ) {
        return null
      }
    }
  }
  const loads = layerNames.map(
    (_, color) =>
      [...colorByConnection.values()].filter((candidate) => candidate === color)
        .length,
  )
  const used = new Set(colorByConnection.values()).size
  return {
    colorByConnection,
    requiredLayerCount: used,
    routingLayerCount: used,
    capacity: Math.max(...loads),
    diagnostic: false,
    warmStarted: true,
  }
}
