export interface Point {
  readonly x: number
  readonly y: number
}

export interface Bounds {
  readonly minX: number
  readonly maxX: number
  readonly minY: number
  readonly maxY: number
}

export type BreakoutEdge = "left" | "right" | "bottom" | "top"

export interface WindingBreakoutRegion {
  readonly id: string
  readonly bounds: Bounds
  readonly edge: BreakoutEdge
}

export interface ConnectionEndpoint {
  readonly regionId: string
  readonly position: Point
}

export interface ConnectionInput {
  readonly id: string
  readonly endpoints: readonly ConnectionEndpoint[]
}

export interface DifferentialPairInput {
  readonly type: "differential"
  readonly connections: readonly [ConnectionInput, ConnectionInput]
}

export type ConnectionOrDifferentialPair =
  | ConnectionInput
  | DifferentialPairInput

export interface WindingBreakoutBusInput {
  readonly id: string
  readonly connectionIds: readonly string[]
  /**
   * NOTE: Despite the legacy JSX name, preferredLayer is a permanent layer
   * assignment for every connection in this bus, not a soft preference.
   */
  readonly preferredLayer?: string
  /** Ordered candidate layers that the solver may distribute this bus over. */
  readonly preferredLayers?: readonly string[]
}

export interface WindingBreakoutSolverInput {
  readonly regions: readonly WindingBreakoutRegion[]
  readonly connections: readonly ConnectionOrDifferentialPair[]
  readonly buses: readonly WindingBreakoutBusInput[]
  readonly boundaryPointSpacing: number
}

export interface BreakoutPoint extends Point {
  readonly regionId: string
  readonly connectionId: string
  readonly layer: string
}

export interface WindingBreakoutOutput {
  readonly breakoutPoints: readonly BreakoutPoint[]
}
