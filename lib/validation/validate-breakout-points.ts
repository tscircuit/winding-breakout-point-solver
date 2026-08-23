import type { SelectedBreakoutEdgeByRegionConnection } from "../gate-placement/select-breakout-edges"
import type { ValidatedRegion } from "../input/validate-winding-breakout-input"
import type { BreakoutPoint } from "../types"

export const validateBreakoutPoints = ({
  points,
  connectionIds,
  regions,
  atomicGroups,
  selectedEdgeByRegionConnection,
}: {
  points: readonly BreakoutPoint[]
  connectionIds: readonly string[]
  regions: readonly ValidatedRegion[]
  atomicGroups: readonly (readonly [string, string])[]
  selectedEdgeByRegionConnection: SelectedBreakoutEdgeByRegionConnection
}): boolean => {
  const regionIds = regions.map((region) => region.id)
  const endpointCounts = new Map<string, number>()
  const layerByConnection = new Map<string, string>()
  let connectionLayersAreValid = true
  for (const point of points) {
    const key = `${point.regionId}:${point.connectionId}`
    endpointCounts.set(key, (endpointCounts.get(key) ?? 0) + 1)
    const previousLayer = layerByConnection.get(point.connectionId)
    if (previousLayer !== undefined && previousLayer !== point.layer) {
      connectionLayersAreValid = false
    }
    layerByConnection.set(point.connectionId, point.layer)
  }
  const expected = regionIds.flatMap((regionId) =>
    connectionIds.map((connectionId) => `${regionId}:${connectionId}`),
  )
  const endpointsAreValid =
    endpointCounts.size === expected.length &&
    expected.every((endpoint) => endpointCounts.get(endpoint) === 1)
  const pointsAreOnSelectedEdges = points.every((point) => {
    const region = regions.find((candidate) => candidate.id === point.regionId)
    const edge = selectedEdgeByRegionConnection
      .get(point.regionId)
      ?.get(point.connectionId)
    if (!region || !edge) return false
    const insideBounds =
      point.x >= region.bounds.minX &&
      point.x <= region.bounds.maxX &&
      point.y >= region.bounds.minY &&
      point.y <= region.bounds.maxY
    if (!insideBounds) return false
    if (edge === "left") return point.x === region.bounds.minX
    if (edge === "right") return point.x === region.bounds.maxX
    if (edge === "bottom") return point.y === region.bounds.minY
    return point.y === region.bounds.maxY
  })
  const atomicGroupsAreValid = atomicGroups.every((group) => {
    const layer = layerByConnection.get(group[0]!)
    if (!layer) return false
    if (
      group.some(
        (connectionId) => layerByConnection.get(connectionId) !== layer,
      )
    ) {
      return false
    }
    return regions.every((region) => {
      const edge = selectedEdgeByRegionConnection.get(region.id)?.get(group[0]!)
      if (
        !edge ||
        group.some(
          (connectionId) =>
            selectedEdgeByRegionConnection.get(region.id)?.get(connectionId) !==
            edge,
        )
      ) {
        return false
      }
      const layerPoints = points.filter(
        (point) =>
          point.regionId === region.id &&
          point.layer === layer &&
          selectedEdgeByRegionConnection
            .get(region.id)
            ?.get(point.connectionId) === edge,
      )
      const vertical = edge === "left" || edge === "right"
      const orderedConnectionIds = [...layerPoints]
        .sort((first, second) =>
          vertical ? first.y - second.y : first.x - second.x,
        )
        .map((point) => point.connectionId)
      const firstIndex = orderedConnectionIds.indexOf(group[0]!)
      const secondIndex = orderedConnectionIds.indexOf(group[1]!)
      return (
        firstIndex !== -1 &&
        secondIndex !== -1 &&
        Math.abs(firstIndex - secondIndex) === 1
      )
    })
  })
  return (
    endpointsAreValid &&
    pointsAreOnSelectedEdges &&
    connectionLayersAreValid &&
    atomicGroupsAreValid
  )
}
