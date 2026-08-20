import { WindingBreakoutInfeasibleError } from "../input/errors"
import type {
  ValidatedConnection,
  ValidatedRegion,
} from "../input/validate-winding-breakout-input"
import type { BreakoutPoint, SharedGateSlot } from "../types"

const GEOMETRY_EPSILON = 1e-9

export interface GatePlacementResult {
  readonly gateOrderByLayerByRegion: Readonly<
    Record<string, Readonly<Record<string, readonly string[]>>>
  >
  readonly layerOffsets: Readonly<Record<string, number>>
  readonly breakoutPoints: readonly BreakoutPoint[]
  readonly sharedGateSlots: readonly SharedGateSlot[]
}

const isVerticalEdge = (edge: ValidatedRegion["edge"]): boolean =>
  edge === "left" || edge === "right"

const getAxisMinimum = (region: ValidatedRegion, vertical: boolean): number => {
  if (vertical) return region.bounds.minY
  return region.bounds.minX
}

const getAxisMaximum = (region: ValidatedRegion, vertical: boolean): number => {
  if (vertical) return region.bounds.maxY
  return region.bounds.maxX
}

const getAxisPosition = (
  position: { readonly x: number; readonly y: number },
  vertical: boolean,
): number => {
  if (vertical) return position.y
  return position.x
}

const deriveLayerOffsets = (
  layerNames: readonly string[],
  boundaryPointSpacing: number,
): Record<string, number> => {
  const staggerOffset = boundaryPointSpacing / 2
  return Object.fromEntries(
    layerNames.map((layer, index) => [
      layer,
      (index - (layerNames.length - 1) / 2) * staggerOffset,
    ]),
  )
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
  atomicGroups: readonly (readonly [string, string])[]
}): string[] => {
  const candidates = referenceOrder.filter(
    (connectionId) => layerByConnection[connectionId] === layer,
  )
  const groupByConnection = new Map(
    atomicGroups.flatMap((group) =>
      group.map((connectionId) => [connectionId, group] as const),
    ),
  )
  const addedGroups = new Set<readonly [string, string]>()
  const result: string[] = []
  for (const connectionId of candidates) {
    const group = groupByConnection.get(connectionId)
    if (!group) {
      result.push(connectionId)
      continue
    }
    if (addedGroups.has(group)) continue
    addedGroups.add(group)
    result.push(...candidates.filter((candidate) => group.includes(candidate)))
  }
  return result
}

const makeGateAxes = ({
  regions,
  connections,
  spacing,
  count,
  layerOffsets,
}: {
  regions: readonly ValidatedRegion[]
  connections: readonly ValidatedConnection[]
  spacing: number
  count: number
  layerOffsets: Readonly<Record<string, number>>
}): { vertical: boolean; axes: number[] } => {
  const vertical = regions.every((region) => isVerticalEdge(region.edge))
  const minAxis = Math.max(
    ...regions.map((region) => getAxisMinimum(region, vertical)),
  )
  const maxAxis = Math.min(
    ...regions.map((region) => getAxisMaximum(region, vertical)),
  )
  const minimumOffset = Math.min(...Object.values(layerOffsets))
  const maximumOffset = Math.max(...Object.values(layerOffsets))
  const span = spacing * Math.max(0, count - 1) + maximumOffset - minimumOffset
  if (maxAxis - minAxis + GEOMETRY_EPSILON < span) {
    throw new WindingBreakoutInfeasibleError(
      `WindingBreakoutSolver: declared breakout edges need ${span.toFixed(2)}mm but expose only ${(maxAxis - minAxis).toFixed(2)}mm`,
    )
  }
  const meanAxis =
    regions.reduce((regionSum, region) => {
      const positions = connections.map(
        (connection) =>
          connection.endpoints.find(
            (endpoint) => endpoint.regionId === region.id,
          )!.position,
      )
      return (
        regionSum +
        positions.reduce(
          (sum, position) => sum + getAxisPosition(position, vertical),
          0,
        ) /
          positions.length
      )
    }, 0) / regions.length
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
  region: ValidatedRegion,
  axis: number,
  vertical: boolean,
) => {
  if (vertical) {
    let x = region.bounds.maxX
    if (region.edge === "left") x = region.bounds.minX
    return {
      x,
      y: axis,
    }
  }
  let y = region.bounds.maxY
  if (region.edge === "bottom") y = region.bounds.minY
  return {
    x: axis,
    y,
  }
}

const groupSharedGateSlots = (
  points: readonly BreakoutPoint[],
): SharedGateSlot[] => {
  const groups = new Map<
    string,
    {
      id: string
      regionId: string
      x: number
      y: number
      indicators: Array<{ connectionId: string; layer: string }>
    }
  >()
  for (const point of points) {
    const key = `${point.regionId}:${point.x.toFixed(9)}:${point.y.toFixed(9)}`
    const group = groups.get(key) ?? {
      id: key,
      regionId: point.regionId,
      x: point.x,
      y: point.y,
      indicators: [],
    }
    group.indicators.push({
      connectionId: point.connectionId,
      layer: point.layer,
    })
    groups.set(key, group)
  }
  return [...groups.values()]
}

export const placeBreakoutGates = ({
  regions,
  connections,
  referenceOrder,
  layerNames,
  boundaryPointSpacing,
  atomicGroups,
}: {
  regions: readonly ValidatedRegion[]
  connections: readonly ValidatedConnection[]
  referenceOrder: readonly string[]
  layerNames: readonly string[]
  boundaryPointSpacing: number
  atomicGroups: readonly (readonly [string, string])[]
}): GatePlacementResult => {
  const layerByConnection = Object.fromEntries(
    connections.map((connection) => [connection.id, connection.layer]),
  )
  const layerOffsets = deriveLayerOffsets(layerNames, boundaryPointSpacing)
  const gateOrderByLayerByRegion = Object.fromEntries(
    regions.map((region) => [
      region.id,
      Object.fromEntries(
        layerNames.map((layer) => [
          layer,
          makeAtomicLayerOrder({
            referenceOrder,
            layer,
            layerByConnection,
            atomicGroups,
          }),
        ]),
      ),
    ]),
  )
  const maxLayerNetCount = Math.max(
    ...layerNames.map(
      (layer) =>
        connections.filter((connection) => connection.layer === layer).length,
    ),
  )
  const { vertical, axes } = makeGateAxes({
    regions,
    connections,
    spacing: boundaryPointSpacing,
    count: maxLayerNetCount,
    layerOffsets,
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
          layerOffset: layerOffsets[layer]!,
        }),
      ),
    ),
  )
  return {
    gateOrderByLayerByRegion,
    layerOffsets,
    breakoutPoints,
    sharedGateSlots: groupSharedGateSlots(breakoutPoints),
  }
}
