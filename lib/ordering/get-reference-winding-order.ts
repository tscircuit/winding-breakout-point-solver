/** Keep each differential pair adjacent at its first natural occurrence. */
export const getReferenceWindingOrder = (
  naturalOrder: readonly string[],
  atomicGroups: readonly (readonly [string, string])[],
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
  return result
}
