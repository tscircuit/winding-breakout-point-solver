import type {
  WindingBreakoutBusInput,
  WindingBreakoutSolverInput,
} from "../types"
import { getCanonicalConnections } from "./get-canonical-connections"

/**
 * Return the layers the solver may use for a bus, in priority order.
 *
 * NOTE: preferredLayer is intentionally exclusive. Although the legacy JSX
 * prop is named as a preference, tscircuit treats it as a permanent assignment.
 */
export const getBusLayerCandidates = (
  bus: Pick<WindingBreakoutBusInput, "preferredLayer" | "preferredLayers">,
): string[] => {
  if (bus.preferredLayer !== undefined) return [bus.preferredLayer]
  if (bus.preferredLayers !== undefined) {
    return [...new Set(bus.preferredLayers)]
  }
  return ["top"]
}

export const getLayerCandidatesByConnection = (
  input: Pick<WindingBreakoutSolverInput, "buses" | "connections">,
): Readonly<Record<string, readonly string[]>> => {
  const candidatesByConnection = new Map<string, readonly string[]>()
  for (const bus of input.buses) {
    const candidates = getBusLayerCandidates(bus)
    for (const connectionId of bus.connectionIds) {
      candidatesByConnection.set(connectionId, candidates)
    }
  }
  return Object.fromEntries(
    getCanonicalConnections(input).map((connection) => [
      connection.id,
      candidatesByConnection.get(connection.id) ?? ["top"],
    ]),
  )
}
