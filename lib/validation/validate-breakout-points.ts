import type { ValidatedRegion } from "../input/validate-winding-breakout-input"
import type { BreakoutPoint } from "../types"

export const validateBreakoutPoints = ({
  points,
  connectionIds,
  regions,
  layerByConnection,
  atomicGroups,
}: {
  points: readonly BreakoutPoint[]
  connectionIds: readonly string[]
  regions: readonly ValidatedRegion[]
  layerByConnection: Readonly<Record<string, string>>
  atomicGroups: readonly (readonly [string, string])[]
}): boolean => {
  const regionIds = regions.map((region) => region.id)
  const endpointCounts = new Map<string, number>()
  for (const point of points) {
    const key = `${point.regionId}:${point.connectionId}`
    endpointCounts.set(key, (endpointCounts.get(key) ?? 0) + 1)
  }
  const expected = regionIds.flatMap((regionId) =>
    connectionIds.map((connectionId) => `${regionId}:${connectionId}`),
  )
  const endpointsAreValid =
    endpointCounts.size === expected.length &&
    expected.every((endpoint) => endpointCounts.get(endpoint) === 1)
  const atomicGroupsAreValid = atomicGroups.every((group) => {
    if (
      new Set(group.map((connectionId) => layerByConnection[connectionId]))
        .size !== 1
    ) {
      return false
    }
    return regions.every((region) => {
      const layer = layerByConnection[group[0]!]
      const layerPoints = points.filter(
        (point) =>
          point.regionId === region.id &&
          layerByConnection[point.connectionId] === layer,
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
  return endpointsAreValid && atomicGroupsAreValid
}
