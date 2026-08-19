const CONNECTION_COLORS = [
  "#2563eb",
  "#dc2626",
  "#059669",
  "#7c3aed",
  "#d97706",
  "#0891b2",
  "#db2777",
  "#4f46e5",
  "#65a30d",
  "#c2410c",
  "#0f766e",
  "#9333ea",
] as const

/** Return a deterministic high-contrast color for a connection ID. */
export const getConnectionColor = (connectionId: string): string => {
  let hash = 2166136261
  for (const character of connectionId) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return CONNECTION_COLORS[(hash >>> 0) % CONNECTION_COLORS.length]!
}
