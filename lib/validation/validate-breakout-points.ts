import type {
  BreakoutBand,
  BreakoutPoint,
  BreakoutPointValidationResult,
} from "../types"

const EPSILON = 1e-9

export const validateBreakoutPoints = ({
  points,
  connectionIds,
  regionIds,
  layerByConnection,
  atomicGroups,
  bandByBus,
}: {
  points: readonly BreakoutPoint[]
  connectionIds: readonly string[]
  regionIds: readonly string[]
  layerByConnection: Readonly<Record<string, string>>
  atomicGroups: readonly (readonly string[])[]
  bandByBus: Readonly<Record<string, BreakoutBand>>
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
    .filter(
      (point) => layerByConnection[point.connectionId] !== point.layer,
    )
    .map((point) => `${point.regionId}:${point.connectionId}`)
  const bandViolations = points.filter((point) => {
    const band = bandByBus[point.busId]
    return !band || point.y < band.min - EPSILON || point.y > band.max + EPSILON
  })
  const atomicGroupViolations = atomicGroups
    .filter(
      (group) =>
        new Set(group.map((connectionId) => layerByConnection[connectionId]))
          .size > 1,
    )
    .map((group) => group.join("/"))
  return {
    valid:
      missingEndpoints.length === 0 &&
      duplicateEndpoints.length === 0 &&
      layerInconsistencies.length === 0 &&
      bandViolations.length === 0 &&
      atomicGroupViolations.length === 0,
    missingEndpoints,
    duplicateEndpoints,
    layerInconsistencies,
    bandViolations,
    atomicGroupViolations,
  }
}
