import type { GatePlacementResult } from "../gate-placement/place-breakout-gates"
import { WindingBreakoutInvariantError } from "../input/errors"
import type { ValidatedWindingInput } from "../input/validate-winding-breakout-input"
import type { WindingBreakoutOutput } from "../types"
import { validateBreakoutPoints } from "./validate-breakout-points"

export const finalizeWindingBreakoutOutput = ({
  validated,
  placement,
}: {
  validated: ValidatedWindingInput
  placement: GatePlacementResult
}): WindingBreakoutOutput => {
  const { layerByConnection } = placement
  const valid = validateBreakoutPoints({
    points: placement.breakoutPoints,
    connectionIds: validated.connections.map((connection) => connection.id),
    regions: validated.regions,
    layerByConnection,
    atomicGroups: validated.atomicConnectionGroups,
  })
  if (!valid) {
    throw new WindingBreakoutInvariantError(
      "WindingBreakoutSolver: generated invalid breakout points",
    )
  }
  return { breakoutPoints: placement.breakoutPoints, layerByConnection }
}
