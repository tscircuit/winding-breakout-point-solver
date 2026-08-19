import type { StackupEntry } from "../types"
import { WindingBreakoutInvariantError } from "../input/errors"

export const stackupIndex = (
  stackup: readonly StackupEntry[],
  layer: string,
): number => stackup.findIndex((entry) => entry.id === layer)

export const hasSolidPlaneBetween = (
  stackup: readonly StackupEntry[],
  firstLayer: string,
  secondLayer: string,
): boolean => {
  const firstIndex = stackupIndex(stackup, firstLayer)
  const secondIndex = stackupIndex(stackup, secondLayer)
  if (firstIndex < 0 || secondIndex < 0) {
    throw new WindingBreakoutInvariantError(
      "WindingBreakoutSolver: layer relationship references an unknown stackup layer",
    )
  }
  const low = Math.min(firstIndex, secondIndex)
  const high = Math.max(firstIndex, secondIndex)
  return stackup
    .slice(low + 1, high)
    .some((entry) => entry.type === "plane" && entry.solid)
}

export const areElectricallyAdjacent = (
  stackup: readonly StackupEntry[],
  firstLayer: string,
  secondLayer: string,
): boolean =>
  firstLayer !== secondLayer &&
  !hasSolidPlaneBetween(stackup, firstLayer, secondLayer)
