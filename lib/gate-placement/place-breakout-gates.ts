import { WindingBreakoutInfeasibleError } from "../input/errors"
import { hasSolidPlaneBetween } from "../layer-assignment/stackup-relationships"
import type {
  BreakoutBand,
  BreakoutPoint,
  SharedGateSlot,
  StackupEntry,
  WindingBreakoutRegion,
} from "../types"

const GEOMETRY_EPSILON = 1e-9

export interface GatePlacementResult {
  readonly gateOrderByRegion: Readonly<Record<string, readonly string[]>>
  readonly gateOrderByLayerByRegion: Readonly<
    Record<string, Readonly<Record<string, readonly string[]>>>
  >
  readonly layerNetCounts: Readonly<Record<string, number>>
  readonly layerOffsets: Readonly<Record<string, number>>
  readonly maxLayerNetCount: number
  readonly breakoutPoints: readonly BreakoutPoint[]
  readonly sharedGateSlots: readonly SharedGateSlot[]
}

const isVerticalEdge = (edge: WindingBreakoutRegion["edge"]): boolean =>
  edge === "left" || edge === "right"

const deriveLayerOffsets = ({
  layerNames,
  stackup,
  explicitOffsets,
  staggerOffset,
}: {
  layerNames: readonly string[]
  stackup: readonly StackupEntry[]
  explicitOffsets?: Readonly<Record<string, number>>
  staggerOffset: number
}): Record<string, number> => {
  if (explicitOffsets) {
    return Object.fromEntries(
      layerNames.map((layer) => [layer, explicitOffsets[layer] ?? 0]),
    )
  }
  const groups: string[][] = []
  let currentGroup: string[] = []
  for (const entry of stackup) {
    if (entry.type === "plane" && entry.solid) {
      if (currentGroup.length > 0) groups.push(currentGroup)
      currentGroup = []
    } else if (entry.type === "signal" && layerNames.includes(entry.id)) {
      currentGroup.push(entry.id)
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup)
  const offsets = Object.fromEntries(layerNames.map((layer) => [layer, 0]))
  for (const group of groups) {
    group.forEach((layer, index) => {
      offsets[layer] = (index - (group.length - 1) / 2) * staggerOffset
    })
  }
  return offsets
}

const makeAtomicLayerOrder = ({
  referenceOrder,
  layer,
  layerByConnection,
  atomicGroups,
}: {
  referenceOrder: readonly string[]
  layer: string
  layerByConnection: Readonly<Record<string, string>>
  atomicGroups: readonly (readonly string[])[]
}): string[] => {
  const candidates = referenceOrder.filter(
    (connectionId) => layerByConnection[connectionId] === layer,
  )
  const groupByConnection = new Map(
    atomicGroups.flatMap((group) =>
      group.map((connectionId) => [connectionId, group] as const),
    ),
  )
  const added = new Set<readonly string[]>()
  const result: string[] = []
  for (const connectionId of candidates) {
    const group = groupByConnection.get(connectionId)
    if (!group) {
      result.push(connectionId)
      continue
    }
    if (added.has(group)) continue
    added.add(group)
    result.push(...candidates.filter((candidate) => group.includes(candidate)))
  }
  return result
}

const makeGateAxes = ({
  regions,
  band,
  spacing,
  count,
  layerOffsets,
  allowBandOverflow,
}: {
  regions: readonly WindingBreakoutRegion[]
  band: BreakoutBand
  spacing: number
  count: number
  layerOffsets: Readonly<Record<string, number>>
  allowBandOverflow: boolean
}): { vertical: boolean; axes: number[] } => {
  const vertical = regions.every((region) => isVerticalEdge(region.edge))
  if (!vertical && !regions.every((region) => !isVerticalEdge(region.edge))) {
    throw new WindingBreakoutInfeasibleError(
      "WindingBreakoutSolver: all coordinated edges must be parallel",
    )
  }
  let minAxis = Math.max(
    band.min,
    ...regions.map((region) =>
      vertical ? region.bounds.minY : region.bounds.minX,
    ),
  )
  let maxAxis = Math.min(
    band.max,
    ...regions.map((region) =>
      vertical ? region.bounds.maxY : region.bounds.maxX,
    ),
  )
  const minimumOffset = Math.min(...Object.values(layerOffsets))
  const maximumOffset = Math.max(...Object.values(layerOffsets))
  const span = spacing * Math.max(0, count - 1) + maximumOffset - minimumOffset
  if (maxAxis - minAxis + GEOMETRY_EPSILON < span && allowBandOverflow) {
    minAxis = Math.max(
      ...regions.map((region) =>
        vertical ? region.bounds.minY : region.bounds.minX,
      ),
    )
    maxAxis = Math.min(
      ...regions.map((region) =>
        vertical ? region.bounds.maxY : region.bounds.maxX,
      ),
    )
  }
  if (maxAxis - minAxis + GEOMETRY_EPSILON < span) {
    throw new WindingBreakoutInfeasibleError(
      `WindingBreakoutSolver: shared facing edges need ${span.toFixed(2)}mm but expose only ${(maxAxis - minAxis).toFixed(2)}mm`,
    )
  }
  const meanAxis =
    regions.reduce(
      (regionSum, region) =>
        regionSum +
        region.ports.reduce(
          (sum, port) => sum + (vertical ? port.position.y : port.position.x),
          0,
        ) /
          region.ports.length,
      0,
    ) / regions.length
  const start = Math.max(
    minAxis - minimumOffset,
    Math.min(
      maxAxis - spacing * Math.max(0, count - 1) - maximumOffset,
      meanAxis - (spacing * Math.max(0, count - 1)) / 2,
    ),
  )
  return {
    vertical,
    axes: Array.from({ length: count }, (_, index) => start + index * spacing),
  }
}

const pointOnEdge = (
  region: WindingBreakoutRegion,
  axis: number,
  vertical: boolean,
) => {
  if (vertical) {
    return {
      x: region.edge === "left" ? region.bounds.minX : region.bounds.maxX,
      y: axis,
    }
  }
  return {
    x: axis,
    y: region.edge === "bottom" ? region.bounds.minY : region.bounds.maxY,
  }
}

const groupSharedGateSlots = (
  points: readonly BreakoutPoint[],
  stackup: readonly StackupEntry[],
): SharedGateSlot[] => {
  const groups = new Map<
    string,
    {
      id: string
      regionId: string
      busId?: string
      x: number
      y: number
      indicators: Array<{ connectionId: string; layer: string; busId?: string }>
    }
  >()
  for (const point of points) {
    const key = `${point.busId ?? "GLOBAL"}:${point.regionId}:${point.x.toFixed(9)}:${point.y.toFixed(9)}`
    const group = groups.get(key) ?? {
      id: key,
      regionId: point.regionId,
      ...(point.busId ? { busId: point.busId } : {}),
      x: point.x,
      y: point.y,
      indicators: [],
    }
    group.indicators.push({
      connectionId: point.connectionId,
      layer: point.layer,
      ...(point.busId ? { busId: point.busId } : {}),
    })
    groups.set(key, group)
  }
  return [...groups.values()].map((group) => ({
    ...group,
    totalIndicatorCount: group.indicators.length,
    reuseType:
      group.indicators.length > 1 &&
      group.indicators.every((first, firstIndex) =>
        group.indicators.every(
          (second, secondIndex) =>
            firstIndex === secondIndex ||
            hasSolidPlaneBetween(stackup, first.layer, second.layer),
        ),
      )
        ? "plane-isolated"
        : "staggered",
  }))
}

export const placeBreakoutGates = ({
  regions,
  busId,
  band,
  referenceOrder,
  naturalOrderByRegion,
  preserveWinding,
  layerNames,
  layerByConnection,
  stackup,
  boundaryPointSpacing,
  breakoutStaggerOffset,
  layerBreakoutOffsets,
  atomicGroups,
  allowBandOverflow,
}: {
  regions: readonly WindingBreakoutRegion[]
  busId: string
  band: BreakoutBand
  referenceOrder: readonly string[]
  naturalOrderByRegion: Readonly<Record<string, readonly string[]>>
  preserveWinding: boolean
  layerNames: readonly string[]
  layerByConnection: Readonly<Record<string, string>>
  stackup: readonly StackupEntry[]
  boundaryPointSpacing: number
  breakoutStaggerOffset: number
  layerBreakoutOffsets?: Readonly<Record<string, number>>
  atomicGroups: readonly (readonly string[])[]
  allowBandOverflow: boolean
}): GatePlacementResult => {
  const gateOrderByRegion = Object.fromEntries(
    regions.map((region, index) => [
      region.id,
      index === 0 || preserveWinding
        ? [...referenceOrder]
        : [...naturalOrderByRegion[region.id]!],
    ]),
  )
  const layerOffsets = deriveLayerOffsets({
    layerNames,
    stackup,
    explicitOffsets: layerBreakoutOffsets,
    staggerOffset: breakoutStaggerOffset,
  })
  const gateOrderByLayerByRegion = Object.fromEntries(
    regions.map((region) => [
      region.id,
      Object.fromEntries(
        layerNames.map((layer) => [
          layer,
          makeAtomicLayerOrder({
            referenceOrder: gateOrderByRegion[region.id]!,
            layer,
            layerByConnection,
            atomicGroups,
          }),
        ]),
      ),
    ]),
  )
  const layerNetCounts = Object.fromEntries(
    layerNames.map((layer) => [
      layer,
      referenceOrder.filter((id) => layerByConnection[id] === layer).length,
    ]),
  )
  const maxLayerNetCount = Math.max(...Object.values(layerNetCounts))
  const { vertical, axes } = makeGateAxes({
    regions,
    band,
    spacing: boundaryPointSpacing,
    count: maxLayerNetCount,
    layerOffsets,
    allowBandOverflow,
  })
  const breakoutPoints = regions.flatMap((region) =>
    layerNames.flatMap((layer) =>
      gateOrderByLayerByRegion[region.id]![layer]!.map(
        (connectionId, slotIndex) => ({
          regionId: region.id,
          connectionId,
          layer,
          ...pointOnEdge(
            region,
            axes[slotIndex]! + layerOffsets[layer]!,
            vertical,
          ),
          slotIndex,
          orderIndex: slotIndex,
          layerOffset: layerOffsets[layer]!,
          busId,
          slotScope: `${busId}:${layer}:${slotIndex}`,
        }),
      ),
    ),
  )
  return {
    gateOrderByRegion,
    gateOrderByLayerByRegion,
    layerNetCounts,
    layerOffsets,
    maxLayerNetCount,
    breakoutPoints,
    sharedGateSlots: groupSharedGateSlots(breakoutPoints, stackup),
  }
}
