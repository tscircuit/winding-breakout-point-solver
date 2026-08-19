import type { WindingBreakoutSolverInput } from "../types"
import { WindingBreakoutInvariantError } from "../input/errors"

const getCollapsedAtomOrder = (
  order: readonly string[],
  groups: readonly (readonly string[])[],
): string[][] => {
  const groupByConnection = new Map(
    groups.flatMap((group) =>
      group.map((connectionId) => [connectionId, group] as const),
    ),
  )
  const added = new Set<readonly string[]>()
  const atoms: string[][] = []
  for (const connectionId of order) {
    const group = groupByConnection.get(connectionId)
    if (!group) {
      atoms.push([connectionId])
      continue
    }
    if (added.has(group)) continue
    added.add(group)
    atoms.push([...group])
  }
  return atoms
}

export const getAtomicConnectionGroups = (
  input: Pick<
    WindingBreakoutSolverInput,
    "atomicConnectionGroups" | "differentialPairs"
  >,
  connectionIds: readonly string[],
): string[][] => {
  const groups = (input.atomicConnectionGroups ?? []).map((group) => [...group])
  const groupByConnection = new Map(
    groups.flatMap((group) =>
      group.map((connectionId) => [connectionId, group] as const),
    ),
  )
  for (const pair of input.differentialPairs ?? []) {
    const existing = groupByConnection.get(pair.positive)
    if (existing?.includes(pair.negative)) continue
    const group = [pair.positive, pair.negative]
    groups.push(group)
    groupByConnection.set(pair.positive, group)
    groupByConnection.set(pair.negative, group)
  }
  const rank = new Map(connectionIds.map((id, index) => [id, index]))
  return groups.sort(
    (first, second) =>
      Math.min(...first.map((id) => rank.get(id)!)) -
      Math.min(...second.map((id) => rank.get(id)!)),
  )
}

export const getReferenceWindingOrder = ({
  connectionIds,
  naturalOrders,
  explicitReferenceOrder,
  atomicGroups,
}: {
  connectionIds: readonly string[]
  naturalOrders: readonly (readonly string[])[]
  explicitReferenceOrder?: readonly string[]
  atomicGroups: readonly (readonly string[])[]
}): string[] => {
  if (explicitReferenceOrder) return [...explicitReferenceOrder]

  // The first region is the physical winding reference in the behavioral
  // oracle. Collapsing atoms at their first occurrence is still used for a
  // deterministic consensus check and by conflict coloring, while expanding
  // the first winding preserves the exact externally observable order.
  const firstOrder = naturalOrders[0] ?? connectionIds
  const atomOrders = naturalOrders.map((order) =>
    getCollapsedAtomOrder(order, atomicGroups),
  )
  if (atomOrders.length > 1) {
    const firstAtoms = atomOrders[0]!
    const atomKey = (atom: readonly string[]) => [...atom].sort().join("\0")
    const seen = new Set(firstAtoms.map(atomKey))
    for (const order of atomOrders.slice(1)) {
      for (const atom of order) {
        if (!seen.has(atomKey(atom))) {
          throw new WindingBreakoutInvariantError(
            "WindingBreakoutSolver: inconsistent atomic winding",
          )
        }
      }
    }
  }
  return [...firstOrder]
}
