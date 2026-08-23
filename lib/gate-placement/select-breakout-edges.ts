import type {
  ValidatedBus,
  ValidatedConnection,
  ValidatedRegion,
} from "../input/validate-winding-breakout-input"
import type { BreakoutEdge, Point } from "../types"

export type SelectedBreakoutEdgeByRegionConnection = ReadonlyMap<
  string,
  ReadonlyMap<string, BreakoutEdge>
>

const BREAKOUT_EDGES: readonly BreakoutEdge[] = [
  "right",
  "left",
  "top",
  "bottom",
]

const distanceToEdge = (
  destination: Point,
  region: ValidatedRegion,
  edge: BreakoutEdge,
): number => {
  const projectedPoint =
    edge === "left" || edge === "right"
      ? {
          x: edge === "left" ? region.bounds.minX : region.bounds.maxX,
          y: Math.max(
            region.bounds.minY,
            Math.min(region.bounds.maxY, destination.y),
          ),
        }
      : {
          x: Math.max(
            region.bounds.minX,
            Math.min(region.bounds.maxX, destination.x),
          ),
          y: edge === "bottom" ? region.bounds.minY : region.bounds.maxY,
        }
  return Math.hypot(
    destination.x - projectedPoint.x,
    destination.y - projectedPoint.y,
  )
}

const getEdgeSelectionGroups = ({
  connections,
  buses,
  atomicGroups,
}: {
  connections: readonly ValidatedConnection[]
  buses: readonly ValidatedBus[]
  atomicGroups: readonly (readonly [string, string])[]
}): string[][] => {
  const groupedConnectionIds = new Set<string>()
  const connectionGroups: string[][] = []
  for (const bus of buses) {
    connectionGroups.push([...bus.connectionIds])
    for (const connectionId of bus.connectionIds) {
      groupedConnectionIds.add(connectionId)
    }
  }
  for (const atomicGroup of atomicGroups) {
    if (
      atomicGroup.some((connectionId) => groupedConnectionIds.has(connectionId))
    ) {
      continue
    }
    connectionGroups.push([...atomicGroup])
    for (const connectionId of atomicGroup) {
      groupedConnectionIds.add(connectionId)
    }
  }
  for (const connection of connections) {
    if (groupedConnectionIds.has(connection.id)) continue
    connectionGroups.push([connection.id])
  }
  return connectionGroups
}

const selectGroupEdge = ({
  region,
  connections,
}: {
  region: ValidatedRegion
  connections: readonly ValidatedConnection[]
}): BreakoutEdge => {
  const destinations = connections.flatMap((connection) => {
    const endpoint = connection.endpoints.find(
      (candidate) => candidate.regionId === region.id,
    )
    return endpoint?.externalDestination ? [endpoint.externalDestination] : []
  })
  if (destinations.length !== connections.length) return region.edge

  const candidateEdges = [
    region.edge,
    ...BREAKOUT_EDGES.filter((edge) => edge !== region.edge),
  ]
  return candidateEdges.reduce((bestEdge, edge) => {
    const bestCost = destinations.reduce(
      (sum, destination) => sum + distanceToEdge(destination, region, bestEdge),
      0,
    )
    const edgeCost = destinations.reduce(
      (sum, destination) => sum + distanceToEdge(destination, region, edge),
      0,
    )
    return edgeCost < bestCost ? edge : bestEdge
  }, candidateEdges[0]!)
}

/**
 * Choose boundary edges for every region/connection pair. Multi-region solves
 * retain their declared coordinated edges. A single-region solve may move one
 * standalone outlier toward its external destination when at least two other
 * connections remain on the declared edge. Buses, differential pairs, and
 * dense cohorts retain the declared edge so destination hints cannot fragment
 * an established fanout.
 */
export const selectBreakoutEdges = ({
  regions,
  connections,
  buses,
  atomicGroups,
}: {
  regions: readonly ValidatedRegion[]
  connections: readonly ValidatedConnection[]
  buses: readonly ValidatedBus[]
  atomicGroups: readonly (readonly [string, string])[]
}): SelectedBreakoutEdgeByRegionConnection => {
  const selectedEdges = new Map<string, Map<string, BreakoutEdge>>()
  for (const region of regions) {
    selectedEdges.set(
      region.id,
      new Map(
        connections.map((connection) => [connection.id, region.edge] as const),
      ),
    )
  }
  if (regions.length !== 1) return selectedEdges

  const region = regions[0]!
  const connectionById = new Map(
    connections.map((connection) => [connection.id, connection] as const),
  )
  const constrainedConnectionIds = new Set([
    ...buses.flatMap((bus) => bus.connectionIds),
    ...atomicGroups.flat(),
  ])
  const selectedRegionEdges = selectedEdges.get(region.id)!
  for (const connectionIds of getEdgeSelectionGroups({
    connections,
    buses,
    atomicGroups,
  })) {
    const groupedConnections = connectionIds.map(
      (connectionId) => connectionById.get(connectionId)!,
    )
    const edge = connectionIds.some((connectionId) =>
      constrainedConnectionIds.has(connectionId),
    )
      ? region.edge
      : selectGroupEdge({ region, connections: groupedConnections })
    for (const connectionId of connectionIds) {
      selectedRegionEdges.set(connectionId, edge)
    }
  }

  const connectionCountByEdge = new Map<BreakoutEdge, number>()
  for (const edge of selectedRegionEdges.values()) {
    connectionCountByEdge.set(edge, (connectionCountByEdge.get(edge) ?? 0) + 1)
  }

  if ((connectionCountByEdge.get(region.edge) ?? 0) < 2) {
    for (const connection of connections) {
      selectedRegionEdges.set(connection.id, region.edge)
    }
    return selectedEdges
  }

  for (const [connectionId, edge] of selectedRegionEdges) {
    if (edge !== region.edge && (connectionCountByEdge.get(edge) ?? 0) > 1) {
      selectedRegionEdges.set(connectionId, region.edge)
    }
  }
  return selectedEdges
}
