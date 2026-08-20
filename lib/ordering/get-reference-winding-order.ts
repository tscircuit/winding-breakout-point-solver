import type { ValidatedBus } from "../input/validate-winding-breakout-input"

/** Keep each differential pair adjacent at its first natural occurrence. */
export const getReferenceWindingOrder = (
  naturalOrder: readonly string[],
  atomicGroups: readonly (readonly [string, string])[],
  buses: readonly ValidatedBus[],
): string[] => {
  const groupByConnection = new Map(
    atomicGroups.flatMap((group) =>
      group.map((connectionId) => [connectionId, group] as const),
    ),
  )
  const addedGroups = new Set<readonly [string, string]>()
  const result: string[] = []
  for (const connectionId of naturalOrder) {
    const group = groupByConnection.get(connectionId)
    if (!group) {
      result.push(connectionId)
      continue
    }
    if (addedGroups.has(group)) continue
    addedGroups.add(group)
    result.push(
      ...naturalOrder.filter((candidate) => group.includes(candidate)),
    )
  }
  const busByConnection = new Map(
    buses.flatMap((bus) =>
      bus.connectionIds.map((connectionId) => [connectionId, bus] as const),
    ),
  )
  const addedBuses = new Set<ValidatedBus>()
  const busContiguousResult: string[] = []
  for (const connectionId of result) {
    const bus = busByConnection.get(connectionId)
    if (!bus) {
      busContiguousResult.push(connectionId)
      continue
    }
    if (addedBuses.has(bus)) continue
    addedBuses.add(bus)
    const busConnectionIds = new Set(bus.connectionIds)
    busContiguousResult.push(
      ...result.filter((candidate) => busConnectionIds.has(candidate)),
    )
  }
  return busContiguousResult
}
