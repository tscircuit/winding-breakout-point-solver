import type { ConnectionInput, WindingBreakoutSolverInput } from "../types"

/** Flatten differential pairs while inheriting their single declared layer. */
export const getCanonicalConnections = (
  input: Pick<WindingBreakoutSolverInput, "connections">,
): ConnectionInput[] => {
  const connections: ConnectionInput[] = []
  for (const entry of input.connections) {
    if ("type" in entry) {
      connections.push(
        ...entry.connections.map((connection) => ({
          ...connection,
          layer: entry.layer,
        })),
      )
    } else {
      connections.push(entry)
    }
  }
  return connections
}
