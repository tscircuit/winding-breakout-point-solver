import type { BreakoutPoint, BreakoutPointValidationResult } from "../types"

export const validateBreakoutPoints = ({
  points,
  connectionIds,
  regionIds,
  layerByConnection,
  atomicGroups,
}: {
  points: readonly BreakoutPoint[]
  connectionIds: readonly string[]
  regionIds: readonly string[]
  layerByConnection: Readonly<Record<string, string>>
  atomicGroups: readonly (readonly [string, string])[]
}): BreakoutPointValidationResult => {
  const endpointCounts = new Map<string, number>()
  for (const point of points) {
    const key = `${point.regionId}:${point.connectionId}`
    endpointCounts.set(key, (endpointCounts.get(key) ?? 0) + 1)
  }
  const expected = regionIds.flatMap((regionId) =>
    connectionIds.map((connectionId) => `${regionId}:${connectionId}`),
  )
  const missingEndpoints = expected.filter(
    (endpoint) => !endpointCounts.has(endpoint),
  )
  const duplicateEndpoints = [...endpointCounts]
    .filter(([, count]) => count > 1)
    .map(([endpoint]) => endpoint)
  const layerInconsistencies = points
    .filter((point) => layerByConnection[point.connectionId] !== point.layer)
    .map((point) => `${point.regionId}:${point.connectionId}`)
  const atomicGroupViolations = atomicGroups
    .filter((group) => {
      if (
        new Set(group.map((connectionId) => layerByConnection[connectionId]))
          .size !== 1
      ) {
        return true
      }
      return regionIds.some((regionId) => {
        const groupPoints = points.filter(
          (point) =>
            point.regionId === regionId && group.includes(point.connectionId),
        )
        return (
          groupPoints.length !== group.length ||
          new Set(groupPoints.map((point) => point.layer)).size !== 1 ||
          Math.abs(groupPoints[0]!.slotIndex - groupPoints[1]!.slotIndex) !== 1
        )
      })
    })
    .map((group) => group.join("/"))
  return {
    valid:
      missingEndpoints.length === 0 &&
      duplicateEndpoints.length === 0 &&
      layerInconsistencies.length === 0 &&
      atomicGroupViolations.length === 0,
    missingEndpoints,
    duplicateEndpoints,
    layerInconsistencies,
    atomicGroupViolations,
  }
}
