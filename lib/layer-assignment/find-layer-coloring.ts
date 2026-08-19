import { WindingBreakoutInfeasibleError } from "../input/errors"
import type { StackupEntry } from "../types"
import type { WindingConflictGraph } from "./build-winding-conflict-graph"
import { hasSolidPlaneBetween } from "./stackup-relationships"

export interface LayerColoringResult {
  readonly colorByConnection: ReadonlyMap<string, number>
  readonly requiredLayerCount: number
  readonly routingLayerCount: number
  readonly capacity: number
  readonly diagnostic: boolean
  readonly warmStarted: boolean
}

interface SearchBudget {
  remaining: number
}

const consumeSearchNode = (budget: SearchBudget): void => {
  budget.remaining--
  if (budget.remaining < 0) {
    throw new WindingBreakoutInfeasibleError(
      "WindingBreakoutSolver: layer-coloring search exhausted maxSearchNodes",
    )
  }
}

const ranks = (order: readonly string[]) =>
  new Map(order.map((connectionId, index) => [connectionId, index]))

const greedyColorGraph = (
  graph: WindingConflictGraph,
  referenceOrder: readonly string[],
  layerLimit = Number.POSITIVE_INFINITY,
): Map<string, number> => {
  const colorByConnection = new Map<string, number>()
  const load = Array.from(
    { length: Number.isFinite(layerLimit) ? layerLimit : graph.size },
    () => 0,
  )
  const orderRank = ranks(referenceOrder)
  const saturation = (connectionId: string): number =>
    new Set(
      [...graph.get(connectionId)!]
        .map((neighbor) => colorByConnection.get(neighbor))
        .filter((color): color is number => color !== undefined),
    ).size
  while (colorByConnection.size < graph.size) {
    const connectionId = [...graph.keys()]
      .filter((id) => !colorByConnection.has(id))
      .sort(
        (first, second) =>
          saturation(second) - saturation(first) ||
          graph.get(second)!.size - graph.get(first)!.size ||
          orderRank.get(first)! - orderRank.get(second)!,
      )[0]!
    const unavailable = new Set(
      [...graph.get(connectionId)!]
        .map((neighbor) => colorByConnection.get(neighbor))
        .filter((color): color is number => color !== undefined),
    )
    let color = 0
    while (unavailable.has(color)) color++
    if (color >= layerLimit) {
      color = load
        .map((colorLoad, candidate) => ({
          candidate,
          conflicts: [...graph.get(connectionId)!].filter(
            (neighbor) => colorByConnection.get(neighbor) === candidate,
          ).length,
          load: colorLoad,
        }))
        .sort(
          (first, second) =>
            first.conflicts - second.conflicts ||
            first.load - second.load ||
            first.candidate - second.candidate,
        )[0]!.candidate
    }
    colorByConnection.set(connectionId, color)
    load[color]!++
  }
  return colorByConnection
}

const findExactColoring = (
  graph: WindingConflictGraph,
  referenceOrder: readonly string[],
  colorCount: number,
  budget: SearchBudget,
): Map<string, number> | null => {
  const colors = new Map<string, number>()
  const orderRank = ranks(referenceOrder)
  const saturation = (connectionId: string): number =>
    new Set(
      [...graph.get(connectionId)!]
        .map((neighbor) => colors.get(neighbor))
        .filter((color): color is number => color !== undefined),
    ).size
  const search = (): boolean => {
    consumeSearchNode(budget)
    if (colors.size === graph.size) return true
    const connectionId = [...graph.keys()]
      .filter((id) => !colors.has(id))
      .sort(
        (first, second) =>
          saturation(second) - saturation(first) ||
          graph.get(second)!.size - graph.get(first)!.size ||
          orderRank.get(first)! - orderRank.get(second)!,
      )[0]!
    const unavailable = new Set(
      [...graph.get(connectionId)!]
        .map((neighbor) => colors.get(neighbor))
        .filter((color): color is number => color !== undefined),
    )
    const highestUsed = colors.size ? Math.max(...colors.values()) : -1
    for (
      let candidate = 0;
      candidate <= Math.min(colorCount - 1, highestUsed + 1);
      candidate++
    ) {
      if (unavailable.has(candidate)) continue
      colors.set(connectionId, candidate)
      if (search()) return true
      colors.delete(connectionId)
    }
    return false
  }
  return search() ? colors : null
}

const findCapacitatedColoring = ({
  graph,
  electricalGraph,
  referenceOrder,
  layerNames,
  colorCount,
  capacity,
  coupledGroups,
  stackup,
  budget,
}: {
  graph: WindingConflictGraph
  electricalGraph: WindingConflictGraph
  referenceOrder: readonly string[]
  layerNames: readonly string[]
  colorCount: number
  capacity: number
  coupledGroups: readonly (readonly string[])[]
  stackup: readonly StackupEntry[]
  budget: SearchBudget
}): Map<string, number> | null => {
  const grouped = new Set(coupledGroups.flat())
  const groups = [
    ...coupledGroups.map((members, index) => ({
      id: `coupled:${index}`,
      members: [...members],
    })),
    ...referenceOrder
      .filter((connectionId) => !grouped.has(connectionId))
      .map((connectionId) => ({
        id: `single:${connectionId}`,
        members: [connectionId],
      })),
  ]
  const groupByConnection = new Map(
    groups.flatMap((group) =>
      group.members.map((connectionId) => [connectionId, group] as const),
    ),
  )
  for (const group of groups) {
    if (
      group.members.some((member) =>
        group.members.some(
          (other) => member !== other && graph.get(member)!.has(other),
        ),
      )
    ) {
      return null
    }
  }
  const colors = new Map<string, number>()
  const groupColors = new Map<string, number>()
  const loads = Array.from({ length: colorCount }, () => 0)
  const orderRank = ranks(referenceOrder)
  const neighbors = (
    group: (typeof groups)[number],
    source: WindingConflictGraph,
  ) =>
    new Set(
      group.members.flatMap((member) =>
        [...source.get(member)!]
          .map((neighbor) => groupByConnection.get(neighbor))
          .filter(
            (candidate): candidate is (typeof groups)[number] =>
              candidate !== undefined && candidate !== group,
          ),
      ),
    )
  const saturation = (group: (typeof groups)[number]): number =>
    new Set(
      [...neighbors(group, graph)]
        .map((neighbor) => groupColors.get(neighbor.id))
        .filter((color): color is number => color !== undefined),
    ).size
  const allowed = (group: (typeof groups)[number], color: number): boolean => {
    if (loads[color]! + group.members.length > capacity) return false
    if (
      [...neighbors(group, graph)].some(
        (neighbor) => groupColors.get(neighbor.id) === color,
      )
    ) {
      return false
    }
    for (const neighbor of neighbors(group, electricalGraph)) {
      const neighborColor = groupColors.get(neighbor.id)
      if (neighborColor === undefined || neighborColor === color) continue
      if (
        !hasSolidPlaneBetween(
          stackup,
          layerNames[color]!,
          layerNames[neighborColor]!,
        )
      ) {
        return false
      }
    }
    return true
  }
  const search = (): boolean => {
    consumeSearchNode(budget)
    if (groupColors.size === groups.length) return true
    const remaining = groups
      .filter((group) => !groupColors.has(group.id))
      .reduce((sum, group) => sum + group.members.length, 0)
    if (loads.reduce((free, load) => free + capacity - load, 0) < remaining) {
      return false
    }
    const group = groups
      .filter((candidate) => !groupColors.has(candidate.id))
      .sort(
        (first, second) =>
          saturation(second) - saturation(first) ||
          second.members.length - first.members.length ||
          neighbors(second, graph).size - neighbors(first, graph).size ||
          Math.min(...first.members.map((id) => orderRank.get(id)!)) -
            Math.min(...second.members.map((id) => orderRank.get(id)!)),
      )[0]!
    const candidates = Array.from(
      { length: colorCount },
      (_, color) => color,
    ).sort((first, second) => loads[first]! - loads[second]! || first - second)
    for (const color of candidates) {
      if (!allowed(group, color)) continue
      groupColors.set(group.id, color)
      for (const member of group.members) colors.set(member, color)
      loads[color]! += group.members.length
      if (search()) return true
      loads[color]! -= group.members.length
      for (const member of group.members) colors.delete(member)
      groupColors.delete(group.id)
    }
    return false
  }
  return search() ? colors : null
}

export const findLayerColoring = ({
  graph,
  electricalGraph,
  referenceOrder,
  layerNames,
  coupledGroups,
  stackup,
  allowDiagnosticBestEffort,
  maxSearchNodes,
}: {
  graph: WindingConflictGraph
  electricalGraph: WindingConflictGraph
  referenceOrder: readonly string[]
  layerNames: readonly string[]
  coupledGroups: readonly (readonly string[])[]
  stackup: readonly StackupEntry[]
  allowDiagnosticBestEffort: boolean
  maxSearchNodes: number
}): LayerColoringResult => {
  const budget = { remaining: maxSearchNodes }
  const greedy = greedyColorGraph(graph, referenceOrder)
  const greedyLayerCount = Math.max(...greedy.values()) + 1
  let requiredLayerCount = 1
  for (; requiredLayerCount <= greedyLayerCount; requiredLayerCount++) {
    if (findExactColoring(graph, referenceOrder, requiredLayerCount, budget))
      break
  }
  if (requiredLayerCount <= layerNames.length) {
    const minimumCapacity = Math.ceil(graph.size / layerNames.length)
    for (let capacity = minimumCapacity; capacity <= graph.size; capacity++) {
      const minimumColorCount = Math.max(
        requiredLayerCount,
        Math.ceil(graph.size / capacity),
      )
      for (
        let colorCount = minimumColorCount;
        colorCount <= layerNames.length;
        colorCount++
      ) {
        const coloring = findCapacitatedColoring({
          graph,
          electricalGraph,
          referenceOrder,
          layerNames,
          colorCount,
          capacity,
          coupledGroups,
          stackup,
          budget,
        })
        if (coloring) {
          return {
            colorByConnection: coloring,
            requiredLayerCount,
            routingLayerCount: colorCount,
            capacity,
            diagnostic: false,
            warmStarted: false,
          }
        }
      }
    }
  }
  if (!allowDiagnosticBestEffort) {
    throw new WindingBreakoutInfeasibleError(
      `WindingBreakoutSolver: routing geometry requires ${requiredLayerCount} layers; only ${layerNames.length} supplied`,
    )
  }
  const fallback = greedyColorGraph(graph, referenceOrder, layerNames.length)
  for (const group of coupledGroups) {
    const sharedColor = fallback.get(group[0]!)!
    for (const member of group) fallback.set(member, sharedColor)
  }
  return {
    colorByConnection: fallback,
    requiredLayerCount,
    routingLayerCount: layerNames.length,
    capacity: graph.size,
    diagnostic: true,
    warmStarted: false,
  }
}
