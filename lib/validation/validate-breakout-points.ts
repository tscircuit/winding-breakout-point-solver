import type { ValidatedRegion } from "../input/validate-winding-breakout-input"
import type { BreakoutPoint } from "../types"

export const validateBreakoutPoints = ({
  points,
  connectionIds,
  regions,
  atomicGroups,
}: {
  points: readonly BreakoutPoint[]
  connectionIds: readonly string[]
  regions: readonly ValidatedRegion[]
  atomicGroups: readonly (readonly [string, string])[]
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
      const layerPoints = points.filter(
        (point) => point.regionId === region.id && point.layer === layer,
      )
      const vertical = region.edge === "left" || region.edge === "right"
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
  return endpointsAreValid && connectionLayersAreValid && atomicGroupsAreValid
}
