import { getLayerCandidatesByConnection } from "./input/get-bus-layer-candidates"
import type { WindingBreakoutSolverInput } from "./types"

export const getLayerNames = (
  input: Pick<WindingBreakoutSolverInput, "buses" | "connections">,
): string[] =>
  [
    ...new Set(Object.values(getLayerCandidatesByConnection(input)).flat()),
  ].sort((first, second) => first.localeCompare(second))
