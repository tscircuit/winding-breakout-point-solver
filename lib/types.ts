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

export interface WindingBreakoutPort {
  readonly connectionId: string
  readonly position: Point
}

export interface WindingComponentGeometry {
  readonly width: number
  readonly height: number
}

export interface WindingPadGrid {
  readonly columns: number
  readonly rows: number
  readonly pitchX: number
  readonly pitchY: number
  readonly padRadius: number
}

export interface BreakoutBand {
  readonly min: number
  readonly max: number
  readonly position?: "lower" | "center" | "upper"
}

export interface WindingBreakoutRegion {
  readonly id: string
  readonly label?: string
  readonly subtitle?: string
  readonly center: Point
  readonly component: WindingComponentGeometry
  readonly padGrid: WindingPadGrid
  readonly bounds: Bounds
  readonly edge: BreakoutEdge
  readonly ports: readonly WindingBreakoutPort[]
}

export interface SignalStackupEntry {
  readonly id: string
  readonly type: "signal"
}

export interface PlaneStackupEntry {
  readonly id: string
  readonly type: "plane"
  readonly solid: boolean
  readonly net?: string
}

export type StackupEntry = SignalStackupEntry | PlaneStackupEntry

export interface DifferentialPairInput {
  readonly positive: string
  readonly negative: string
  readonly targetSpacing?: number
}

export interface WindingBreakoutExampleMetadata {
  readonly id: string
  readonly label: string
  readonly shortLabel: string
  readonly description: string
  readonly sourceFile: string
}

export interface WindingBreakoutSolverInput {
  readonly sample?: WindingBreakoutExampleMetadata
  readonly regions: readonly WindingBreakoutRegion[]
  readonly padLayer: string
  readonly layerNames: readonly string[]
  readonly stackup: readonly StackupEntry[]
  readonly boundaryPointSpacing: number
  readonly breakoutStaggerOffset: number
  readonly differentialPairs?: readonly DifferentialPairInput[]
  readonly atomicConnectionGroups?: readonly (readonly string[])[]
  readonly layerBreakoutOffsets?: Readonly<Record<string, number>>
  readonly initialLayerByConnection?: Readonly<Record<string, string>>
  readonly initialLayerByBus?: Readonly<
    Record<string, Readonly<Record<string, string>>>
  >
  readonly referenceOrder?: readonly string[]
  readonly referenceOrderByBus?: Readonly<Record<string, readonly string[]>>
  readonly preserveWinding?: boolean
  readonly preserveWindingByBus?: Readonly<Record<string, boolean>>
  readonly busLocalOptimization?: boolean
  readonly busByConnection?: Readonly<Record<string, string>>
  readonly busIds?: readonly string[]
  readonly busBands?: Readonly<Record<string, BreakoutBand>>
  readonly maxSearchNodes?: number
  readonly allowDiagnosticBestEffort?: boolean
}

export interface BreakoutPoint extends Point {
  readonly regionId: string
  readonly connectionId: string
  readonly layer: string
  readonly slotIndex: number
  readonly orderIndex: number
  readonly layerOffset: number
  readonly busId: string
  readonly slotScope: string
}

export interface SharedGateIndicator {
  readonly connectionId: string
  readonly layer: string
  readonly busId?: string
}

export interface SharedGateSlot extends Point {
  readonly id: string
  readonly regionId: string
  readonly indicators: readonly SharedGateIndicator[]
  readonly totalIndicatorCount: number
  readonly reuseType: "plane-isolated" | "staggered"
  readonly busId?: string
}

export interface BreakoutPointValidationResult {
  readonly valid: boolean
  readonly missingEndpoints: readonly string[]
  readonly duplicateEndpoints: readonly string[]
  readonly layerInconsistencies: readonly string[]
  readonly bandViolations: readonly BreakoutPoint[]
  readonly atomicGroupViolations: readonly string[]
}

export interface WindingBreakoutBusResult {
  readonly solved: boolean
  readonly busId: string
  readonly band: BreakoutBand
  readonly referenceOrder: readonly string[]
  readonly naturalOrderByRegion: Readonly<Record<string, readonly string[]>>
  readonly gateOrderByRegion: Readonly<Record<string, readonly string[]>>
  readonly gateOrderByLayerByRegion: Readonly<
    Record<string, Readonly<Record<string, readonly string[]>>>
  >
  readonly layerByConnection: Readonly<Record<string, string>>
  readonly layerNetCounts: Readonly<Record<string, number>>
  readonly layerOffsets: Readonly<Record<string, number>>
  readonly maxLayerNetCount: number
  readonly requiredLayerCount: number
  readonly routingLayerCount: number
  readonly breakoutPoints: readonly BreakoutPoint[]
  readonly sharedGateSlots: readonly SharedGateSlot[]
  readonly validation: BreakoutPointValidationResult
}

export interface WindingBreakoutOutput {
  readonly solved: true
  readonly busResults: Readonly<Record<string, WindingBreakoutBusResult>>
  readonly busIds: readonly string[]
  readonly busBands: Readonly<Record<string, BreakoutBand>>
  readonly busByConnection: Readonly<Record<string, string>>
  readonly referenceOrderByBus: Readonly<Record<string, readonly string[]>>
  readonly referenceOrder: readonly string[]
  readonly naturalOrderByRegion: Readonly<Record<string, readonly string[]>>
  readonly gateOrderByRegion: Readonly<Record<string, readonly string[]>>
  readonly gateOrderByLayerByRegion: Readonly<
    Record<string, Readonly<Record<string, readonly string[]>>>
  >
  readonly layerByConnection: Readonly<Record<string, string>>
  readonly layerOffsets: Readonly<Record<string, number>>
  readonly requiredLayerCount: number
  readonly routingLayerCount: number
  readonly breakoutPoints: readonly BreakoutPoint[]
  readonly sharedGateSlots: readonly SharedGateSlot[]
  readonly validation: BreakoutPointValidationResult
}

export interface WindingBreakoutDiagnosticOutput
  extends Omit<WindingBreakoutOutput, "solved"> {
  readonly solved: false
  readonly diagnostic: true
  readonly unresolvedReasons: readonly string[]
}

export type WindingBreakoutExample = WindingBreakoutSolverInput & {
  readonly sample: WindingBreakoutExampleMetadata
}
