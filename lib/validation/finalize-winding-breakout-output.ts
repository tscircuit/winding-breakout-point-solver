import type { GatePlacementResult } from "../gate-placement/place-breakout-gates"
import { WindingBreakoutInvariantError } from "../input/errors"
import type { ValidatedWindingInput } from "../input/validate-winding-breakout-input"
import type { ReferenceOrderingResult } from "../solvers/ReferenceOrderingSolver"
import type { WindingBreakoutOutput } from "../types"
import { validateBreakoutPoints } from "./validate-breakout-points"

export const finalizeWindingBreakoutOutput = ({
  validated,
  ordering,
  placement,
}: {
  validated: ValidatedWindingInput
  ordering: ReferenceOrderingResult
  placement: GatePlacementResult
}): WindingBreakoutOutput => {
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
    referenceOrder: ordering.referenceOrder,
    naturalOrderByRegion: ordering.naturalOrderByRegion,
    gateOrderByLayerByRegion: placement.gateOrderByLayerByRegion,
    layerOffsets: placement.layerOffsets,
    breakoutPoints: placement.breakoutPoints,
    sharedGateSlots: placement.sharedGateSlots,
    validation,
  }
}
