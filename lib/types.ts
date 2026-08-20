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
  readonly layer: string
  readonly endpoints: readonly ConnectionEndpoint[]
}

export interface DifferentialPairInput {
  readonly type: "differential"
  readonly layer: string
  readonly connections: readonly [
    Omit<ConnectionInput, "layer">,
    Omit<ConnectionInput, "layer">,
  ]
}

export type ConnectionOrDifferentialPair =
  | ConnectionInput
  | DifferentialPairInput

export interface WindingBreakoutSolverInput {
  readonly regions: readonly WindingBreakoutRegion[]
  readonly connections: readonly ConnectionOrDifferentialPair[]
  readonly boundaryPointSpacing: number
}

export interface BreakoutPoint extends Point {
  readonly regionId: string
  readonly connectionId: string
  readonly layer: string
  readonly slotIndex: number
  readonly layerOffset: number
}

export interface SharedGateIndicator {
  readonly connectionId: string
  readonly layer: string
}

export interface SharedGateSlot extends Point {
  readonly id: string
  readonly regionId: string
  readonly indicators: readonly SharedGateIndicator[]
}

export interface BreakoutPointValidationResult {
  readonly valid: boolean
  readonly missingEndpoints: readonly string[]
  readonly duplicateEndpoints: readonly string[]
  readonly layerInconsistencies: readonly string[]
  readonly atomicGroupViolations: readonly string[]
}

export interface WindingBreakoutOutput {
  readonly solved: true
  readonly referenceOrder: readonly string[]
  readonly naturalOrderByRegion: Readonly<Record<string, readonly string[]>>
  readonly gateOrderByLayerByRegion: Readonly<
    Record<string, Readonly<Record<string, readonly string[]>>>
  >
  readonly layerOffsets: Readonly<Record<string, number>>
  readonly breakoutPoints: readonly BreakoutPoint[]
  readonly sharedGateSlots: readonly SharedGateSlot[]
  readonly validation: BreakoutPointValidationResult
}
