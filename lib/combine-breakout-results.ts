import type {
  WindingBreakoutBusResult,
  WindingBreakoutDiagnosticOutput,
  WindingBreakoutOutput,
  WindingBreakoutSolverInput,
} from "./types"
import { validateBreakoutPoints } from "./validation/validate-breakout-points"

export const combineBreakoutResults = ({
  input,
  busIds,
  busBands,
  busByConnection,
  busResults,
}: {
  input: WindingBreakoutSolverInput
  busIds: readonly string[]
  busBands: WindingBreakoutOutput["busBands"]
  busByConnection: WindingBreakoutOutput["busByConnection"]
  busResults: Readonly<Record<string, WindingBreakoutBusResult>>
}): WindingBreakoutOutput | WindingBreakoutDiagnosticOutput => {
  const orderedResults = busIds.map((busId) => busResults[busId]!)
  const referenceOrderByBus = Object.fromEntries(
    orderedResults.map((result) => [result.busId, result.referenceOrder]),
  )
  const referenceOrder = orderedResults.flatMap(
    (result) => result.referenceOrder,
  )
  const layerByConnection = Object.assign(
    {},
    ...orderedResults.map((result) => result.layerByConnection),
  )
  const breakoutPoints = orderedResults.flatMap(
    (result) => result.breakoutPoints,
  )
  const atomicGroups = [
    ...(input.atomicConnectionGroups ?? []),
    ...(input.differentialPairs ?? []).map((pair) => [
      pair.positive,
      pair.negative,
    ]),
  ]
  const validation = validateBreakoutPoints({
    points: breakoutPoints,
    connectionIds: referenceOrder,
    regionIds: input.regions.map((region) => region.id),
    layerByConnection,
    atomicGroups,
    bandByBus: busBands,
  })
  const common = {
    busResults,
    busIds,
    busBands,
    busByConnection,
    referenceOrderByBus,
    referenceOrder,
    naturalOrderByRegion: Object.fromEntries(
      input.regions.map((region) => [
        region.id,
        orderedResults.flatMap(
          (result) => result.naturalOrderByRegion[region.id] ?? [],
        ),
      ]),
    ),
    gateOrderByRegion: Object.fromEntries(
      input.regions.map((region) => [
        region.id,
        orderedResults.flatMap(
          (result) => result.gateOrderByRegion[region.id] ?? [],
        ),
      ]),
    ),
    gateOrderByLayerByRegion: Object.fromEntries(
      input.regions.map((region) => [
        region.id,
        Object.fromEntries(
          input.layerNames.map((layer) => [
            layer,
            orderedResults.flatMap(
              (result) =>
                result.gateOrderByLayerByRegion[region.id]?.[layer] ?? [],
            ),
          ]),
        ),
      ]),
    ),
    layerByConnection,
    layerOffsets: Object.assign(
      {},
      ...orderedResults.map((result) => result.layerOffsets),
    ),
    requiredLayerCount: Math.max(
      ...orderedResults.map((result) => result.requiredLayerCount),
    ),
    routingLayerCount: Math.max(
      ...orderedResults.map((result) => result.routingLayerCount),
    ),
    breakoutPoints,
    sharedGateSlots: orderedResults.flatMap(
      (result) => result.sharedGateSlots,
    ),
    validation,
  }
  const reasons = [
    ...orderedResults
      .filter((result) => !result.solved)
      .map((result) => `bus ${result.busId} has unsolved breakpoint placement`),
    ...(validation.valid ? [] : ["breakpoint validation failed"]),
  ]
  return reasons.length === 0
    ? { ...common, solved: true }
    : { ...common, solved: false, diagnostic: true, unresolvedReasons: reasons }
}
