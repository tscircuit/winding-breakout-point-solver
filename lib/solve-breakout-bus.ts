import { placeBreakoutGates } from "./gate-placement/place-breakout-gates"
import { WindingBreakoutInvariantError } from "./input/errors"
import { buildWindingConflictGraph } from "./layer-assignment/build-winding-conflict-graph"
import { findLayerColoring } from "./layer-assignment/find-layer-coloring"
import { getInitialLayerColoring } from "./layer-assignment/get-initial-layer-coloring"
import { getNaturalWindingOrder } from "./ordering/get-natural-winding-order"
import {
  getAtomicConnectionGroups,
  getReferenceWindingOrder,
} from "./ordering/get-reference-winding-order"
import type {
  BreakoutBand,
  WindingBreakoutBusResult,
  WindingBreakoutSolverInput,
} from "./types"
import { validateBreakoutPoints } from "./validation/validate-breakout-points"

export const solveBreakoutBus = ({
  input,
  busId,
  band,
  connectionIds,
}: {
  input: WindingBreakoutSolverInput
  busId: string
  band: BreakoutBand
  connectionIds: readonly string[]
}): WindingBreakoutBusResult => {
  const connectionSet = new Set(connectionIds)
  const naturalOrderByRegion = Object.fromEntries(
    input.regions.map((region) => [
      region.id,
      getNaturalWindingOrder({
        ...region,
        ports: region.ports.filter((port) =>
          connectionSet.has(port.connectionId),
        ),
      }),
    ]),
  )
  const atomicGroups = getAtomicConnectionGroups(input, connectionIds).filter(
    (group) => group.every((connectionId) => connectionSet.has(connectionId)),
  )
  const referenceOrder = getReferenceWindingOrder({
    connectionIds,
    naturalOrders: Object.values(naturalOrderByRegion),
    explicitReferenceOrder:
      input.referenceOrderByBus?.[busId] ??
      (input.busIds?.length === 1 ? input.referenceOrder : undefined),
    atomicGroups,
  })
  const graph = buildWindingConflictGraph(connectionIds)
  const hints = input.initialLayerByBus?.[busId] ?? input.initialLayerByConnection
  const coloring =
    getInitialLayerColoring({
      connectionIds,
      layerNames: input.layerNames,
      hints,
      graph,
      electricalGraph: graph,
      coupledGroups: atomicGroups,
      stackup: input.stackup,
    }) ??
    findLayerColoring({
      graph,
      electricalGraph: graph,
      referenceOrder,
      layerNames: input.layerNames,
      coupledGroups: atomicGroups,
      stackup: input.stackup,
      allowDiagnosticBestEffort: input.allowDiagnosticBestEffort ?? false,
      maxSearchNodes: input.maxSearchNodes ?? 100_000,
    })
  const layerByConnection = Object.fromEntries(
    connectionIds.map((connectionId) => {
      const color = coloring.colorByConnection.get(connectionId)
      const layer = color === undefined ? undefined : input.layerNames[color]
      if (!layer) {
        throw new WindingBreakoutInvariantError(
          `WindingBreakoutSolver: no breakout layer for ${connectionId}`,
        )
      }
      return [connectionId, layer]
    }),
  )
  const placement = placeBreakoutGates({
    regions: input.regions,
    busId,
    band,
    referenceOrder,
    naturalOrderByRegion,
    preserveWinding:
      input.preserveWindingByBus?.[busId] ?? input.preserveWinding ?? true,
    layerNames: input.layerNames,
    layerByConnection,
    stackup: input.stackup,
    boundaryPointSpacing: input.boundaryPointSpacing,
    breakoutStaggerOffset: input.breakoutStaggerOffset,
    layerBreakoutOffsets: input.layerBreakoutOffsets,
    atomicGroups,
    allowBandOverflow: false,
  })
  const validation = validateBreakoutPoints({
    points: placement.breakoutPoints,
    connectionIds,
    regionIds: input.regions.map((region) => region.id),
    layerByConnection,
    atomicGroups,
    bandByBus: { [busId]: band },
  })
  return {
    solved: validation.valid && !coloring.diagnostic,
    busId,
    band,
    referenceOrder,
    naturalOrderByRegion,
    gateOrderByRegion: placement.gateOrderByRegion,
    gateOrderByLayerByRegion: placement.gateOrderByLayerByRegion,
    layerByConnection,
    layerNetCounts: placement.layerNetCounts,
    layerOffsets: placement.layerOffsets,
    maxLayerNetCount: placement.maxLayerNetCount,
    requiredLayerCount: coloring.requiredLayerCount,
    routingLayerCount: coloring.routingLayerCount,
    breakoutPoints: placement.breakoutPoints,
    sharedGateSlots: placement.sharedGateSlots,
    validation,
  }
}
