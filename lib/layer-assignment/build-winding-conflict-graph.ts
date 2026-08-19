import { WindingBreakoutInvariantError } from "../input/errors"

export type WindingConflictGraph = Map<string, Set<string>>

export const buildWindingConflictGraph = (
  connectionIds: readonly string[],
  conflicts: readonly {
    readonly firstConnectionId: string
    readonly secondConnectionId: string
  }[] = [],
): WindingConflictGraph => {
  const graph: WindingConflictGraph = new Map(
    connectionIds.map((connectionId) => [connectionId, new Set<string>()]),
  )
  for (const conflict of conflicts) {
    graph.get(conflict.firstConnectionId)?.add(conflict.secondConnectionId)
    graph.get(conflict.secondConnectionId)?.add(conflict.firstConnectionId)
  }
  return graph
}

export const addWindingConflict = (
  graph: WindingConflictGraph,
  firstConnectionId: string,
  secondConnectionId: string,
): boolean => {
  const first = graph.get(firstConnectionId)
  const second = graph.get(secondConnectionId)
  if (!first || !second) {
    throw new WindingBreakoutInvariantError(
      "WindingBreakoutSolver: conflict graph references unknown connection",
    )
  }
  if (first.has(secondConnectionId)) return false
  first.add(secondConnectionId)
  second.add(firstConnectionId)
  return true
}
