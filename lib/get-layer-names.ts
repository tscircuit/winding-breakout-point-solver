import { getCanonicalConnections } from "./input/get-canonical-connections"
import type { WindingBreakoutSolverInput } from "./types"

export const getLayerNames = (
  input: Pick<WindingBreakoutSolverInput, "connections">,
): string[] =>
  [
    ...new Set(
      getCanonicalConnections(input).map((connection) => connection.layer),
    ),
  ].sort((first, second) => first.localeCompare(second))
