import { BaseSolver } from "@tscircuit/solver-utils"
import type { GraphicsObject } from "graphics-debug"
import { WindingBreakoutInvariantError } from "../input/errors"
import type { ValidatedWindingInput } from "../input/validate-winding-breakout-input"
import { getNaturalWindingOrder } from "../ordering/get-natural-winding-order"
import { getReferenceWindingOrder } from "../ordering/get-reference-winding-order"
import type { WindingBreakoutSolverInput } from "../types"
import { createSolverPhaseVisualization } from "../visualization/create-solver-phase-visualization"

export interface ReferenceOrderingResult {
  readonly naturalOrderByRegion: Readonly<Record<string, readonly string[]>>
  readonly referenceOrder: readonly string[]
}

export interface ReferenceOrderingSolverParams {
  readonly input: WindingBreakoutSolverInput
  readonly validated: ValidatedWindingInput
  readonly visualizationLayer?: string
}

export class ReferenceOrderingSolver extends BaseSolver {
  private readonly naturalOrderByRegion: Record<string, readonly string[]> = {}
  private currentRegionIndex = 0
  private output?: ReferenceOrderingResult
  private visualizedOrder?: readonly string[]
  private visualizedRegionId?: string
  private visualizationLayer?: string

  constructor(private readonly params: ReferenceOrderingSolverParams) {
    super()
    this.visualizationLayer = params.visualizationLayer
    this.MAX_ITERATIONS = params.validated.regions.length + 1
  }

  setVisualizationLayer(layer?: string): void {
    this.visualizationLayer = layer
  }

  override _step(): void {
    const region = this.params.validated.regions[this.currentRegionIndex]
    if (region) {
      const naturalOrder = getNaturalWindingOrder(
        region,
        this.params.validated.connections,
      )
      this.naturalOrderByRegion[region.id] = naturalOrder
      this.visualizedRegionId = region.id
      this.visualizedOrder = naturalOrder
      this.currentRegionIndex += 1
      this.stats = {
        phase: "derive-natural-order",
        regionId: region.id,
        completedRegions: this.currentRegionIndex,
        totalRegions: this.params.validated.regions.length,
        naturalOrder,
      }
      return
    }

    const firstRegion = this.params.validated.regions[0]!
    const referenceOrder = getReferenceWindingOrder(
      this.naturalOrderByRegion[firstRegion.id]!,
      this.params.validated.atomicConnectionGroups,
    )
    this.output = {
      naturalOrderByRegion: this.naturalOrderByRegion,
      referenceOrder,
    }
    this.visualizedRegionId = firstRegion.id
    this.visualizedOrder = referenceOrder
    this.stats = {
      phase: "atomicize-reference-order",
      referenceRegion: firstRegion.id,
      referenceOrder,
    }
    this.solved = true
  }

  computeProgress(): number {
    let completedMicrosteps = this.currentRegionIndex
    if (this.output) completedMicrosteps += 1
    return completedMicrosteps / this.MAX_ITERATIONS
  }

  override getConstructorParams(): [ReferenceOrderingSolverParams] {
    return [this.params]
  }

  override getOutput(): ReferenceOrderingResult {
    if (!this.solved || !this.output) {
      throw new WindingBreakoutInvariantError(
        "WindingBreakoutSolver: reference order requested before ordering completed",
      )
    }
    return this.output
  }

  override visualize(): GraphicsObject {
    const firstRegionId = this.params.validated.regions[0]!.id
    let detail = `Next microstep: derive natural order for region “${firstRegionId}”`
    if (this.visualizedRegionId && !this.output) {
      detail = `Natural order for region “${this.visualizedRegionId}” · ${this.currentRegionIndex}/${this.params.validated.regions.length} regions processed`
    }
    if (this.output) {
      detail = `Reference region “${firstRegionId}” finalized; differential pairs were made adjacent and atomic`
    }
    return createSolverPhaseVisualization({
      input: this.params.input,
      activeLayer: this.visualizationLayer,
      phase: "Step 1 · Derive reference order",
      detail,
      referenceOrder: this.visualizedOrder,
      referenceRegionId: this.visualizedRegionId,
      showReferenceNumbers: true,
    })
  }
}
