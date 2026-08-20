import type { ConnectionInput, WindingBreakoutSolverInput } from "../types"

/** Flatten differential pairs without losing their caller-owned endpoint data. */
export const getCanonicalConnections = (
  input: Pick<WindingBreakoutSolverInput, "connections">,
): ConnectionInput[] => {
  const connections: ConnectionInput[] = []
  for (const entry of input.connections) {
    if ("type" in entry) {
      connections.push(...entry.connections)
    } else {
      connections.push(entry)
    }
  }
  return connections
}
