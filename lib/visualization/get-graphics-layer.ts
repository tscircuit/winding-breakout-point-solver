import type { WindingBreakoutSolverInput } from "../types"
import { getLayerNames } from "../get-layer-names"

/** Convert signal-layer IDs to the layer metadata understood by graphics-debug. */
export const getGraphicsLayer = (
  input: WindingBreakoutSolverInput,
  layerIds: readonly string[],
): string => {
  const signalLayerIds = getLayerNames(input)
  const indexes = [...new Set(layerIds)].map((layerId) => {
    const index = signalLayerIds.indexOf(layerId)
    if (index < 0) {
      throw new Error(`Cannot visualize unknown signal layer "${layerId}"`)
    }
    return index
  })
  if (indexes.length === 0) {
    throw new Error("Cannot create graphics metadata without a signal layer")
  }
  indexes.sort((first, second) => first - second)
  return `z${indexes.join(",")}`
}
