import { placeBreakoutGates } from "./gate-placement/place-breakout-gates"
import { WindingBreakoutInvariantError } from "./input/errors"
import type { ValidatedWindingInput } from "./input/validate-winding-breakout-input"
import { getNaturalWindingOrder } from "./ordering/get-natural-winding-order"
import { getReferenceWindingOrder } from "./ordering/get-reference-winding-order"
import type { WindingBreakoutOutput, WindingBreakoutSolverInput } from "./types"
import { validateBreakoutPoints } from "./validation/validate-breakout-points"

export const solveWindingBreakout = (
  input: WindingBreakoutSolverInput,
  validated: ValidatedWindingInput,
): WindingBreakoutOutput => {
  const naturalOrderByRegion = Object.fromEntries(
    validated.regions.map((region) => [
      region.id,
      getNaturalWindingOrder(region, validated.connections),
    ]),
  )
  const firstRegion = validated.regions[0]!
  const referenceOrder = getReferenceWindingOrder(
    naturalOrderByRegion[firstRegion.id]!,
    validated.atomicConnectionGroups,
  )
  const placement = placeBreakoutGates({
    regions: validated.regions,
    connections: validated.connections,
    referenceOrder,
    layerNames: validated.layerNames,
    boundaryPointSpacing: input.boundaryPointSpacing,
    atomicGroups: validated.atomicConnectionGroups,
  })
  const layerByConnection = Object.fromEntries(
    validated.connections.map((connection) => [
      connection.id,
      connection.layer,
    ]),
  )
  const validation = validateBreakoutPoints({
    points: placement.breakoutPoints,
    connectionIds: validated.connections.map((connection) => connection.id),
    regionIds: validated.regions.map((region) => region.id),
    layerByConnection,
    atomicGroups: validated.atomicConnectionGroups,
  })
  if (!validation.valid) {
    throw new WindingBreakoutInvariantError(
      "WindingBreakoutSolver: generated invalid breakout points",
    )
  }
  return {
    solved: true,
    referenceOrder,
    naturalOrderByRegion,
    gateOrderByLayerByRegion: placement.gateOrderByLayerByRegion,
    layerOffsets: placement.layerOffsets,
    breakoutPoints: placement.breakoutPoints,
    sharedGateSlots: placement.sharedGateSlots,
    validation,
  }
}
