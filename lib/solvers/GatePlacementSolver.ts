import { BaseSolver } from "@tscircuit/solver-utils"
import type { GraphicsObject } from "graphics-debug"
import {
  type GatePlacementResult,
  placeBreakoutGates,
} from "../gate-placement/place-breakout-gates"
import { WindingBreakoutInvariantError } from "../input/errors"
import type { ValidatedWindingInput } from "../input/validate-winding-breakout-input"
import { assignConnectionLayers } from "../layer-assignment/assign-connection-layers"
import type { BreakoutPoint, WindingBreakoutSolverInput } from "../types"
import { createSolverPhaseVisualization } from "../visualization/create-solver-phase-visualization"
import type { WindingBreakoutVisualizationState } from "../visualization/create-state-graphics"
import { getGraphicsLayer } from "../visualization/get-graphics-layer"
import type { ReferenceOrderingResult } from "./ReferenceOrderingSolver"

const getSharedGateSlotCount = (points: readonly BreakoutPoint[]): number =>
  new Set(
    points.map(
      (point) =>
        `${point.regionId}:${point.x.toFixed(9)}:${point.y.toFixed(9)}`,
    ),
  ).size

export interface GatePlacementSolverParams {
  readonly input: WindingBreakoutSolverInput
  readonly validated: ValidatedWindingInput
  readonly ordering: ReferenceOrderingResult
  readonly visualizationLayer?: string
}

export class GatePlacementSolver extends BaseSolver {
  private batchIndex = 0
  private output?: GatePlacementResult
  private plannedPlacement?: GatePlacementResult
  private readonly placementBatches: ReadonlyArray<{
    readonly regionId: string
    readonly layer: string
  }>
  private readonly visibleBreakoutPoints: BreakoutPoint[] = []
  private readonly layerByConnection: Readonly<Record<string, string>>
  private visualizationLayer?: string

  constructor(private readonly params: GatePlacementSolverParams) {
    super()
    this.visualizationLayer = params.visualizationLayer
    const assignment = assignConnectionLayers({
      validated: params.validated,
      referenceOrder: params.ordering.referenceOrder,
    })
    this.layerByConnection = assignment.layerByConnection
    this.placementBatches = params.validated.regions.flatMap((region) =>
      assignment.layerNames.map((layer) => ({
        regionId: region.id,
        layer,
      })),
    )
    this.MAX_ITERATIONS = this.placementBatches.length + 2
  }

  setVisualizationLayer(layer?: string): void {
    this.visualizationLayer = layer
  }

  override _step(): void {
    if (!this.plannedPlacement) {
      this.plannedPlacement = placeBreakoutGates({
        regions: this.params.validated.regions,
        connections: this.params.validated.connections,
        referenceOrder: this.params.ordering.referenceOrder,
        layerNames: [...new Set(Object.values(this.layerByConnection))].sort(
          (first, second) => first.localeCompare(second),
        ),
        layerByConnection: this.layerByConnection,
        boundaryPointSpacing: this.params.input.boundaryPointSpacing,
        atomicGroups: this.params.validated.atomicConnectionGroups,
      })
      this.stats = {
        phase: "plan-gate-grid",
        regionLayerBatches: this.placementBatches.length,
        placedBreakpoints: 0,
      }
      return
    }

    const batch = this.placementBatches[this.batchIndex]
    if (batch) {
      this.visibleBreakoutPoints.push(
        ...this.plannedPlacement.breakoutPoints.filter(
          (point) =>
            point.regionId === batch.regionId &&
            this.layerByConnection[point.connectionId] === batch.layer,
        ),
      )
      this.batchIndex += 1
      this.stats = {
        phase: "place-region-layer-batch",
        regionId: batch.regionId,
        layer: batch.layer,
        completedBatches: this.batchIndex,
        totalBatches: this.placementBatches.length,
        placedBreakpoints: this.visibleBreakoutPoints.length,
      }
      return
    }

    this.output = this.plannedPlacement
    this.stats = {
      phase: "finalize-shared-gate-slots",
      placedBreakpoints: this.output.breakoutPoints.length,
      sharedGateSlots: getSharedGateSlotCount(this.output.breakoutPoints),
    }
    this.solved = true
  }

  computeProgress(): number {
    let completedMicrosteps = this.batchIndex
    if (this.plannedPlacement) completedMicrosteps += 1
    if (this.output) completedMicrosteps += 1
    return completedMicrosteps / this.MAX_ITERATIONS
  }

  override getConstructorParams(): [GatePlacementSolverParams] {
    return [this.params]
  }

  override getOutput(): GatePlacementResult {
    if (!this.solved || !this.output) {
      throw new WindingBreakoutInvariantError(
        "WindingBreakoutSolver: gate placement requested before placement completed",
      )
    }
    return this.output
  }

  override visualize(): GraphicsObject {
    let detail =
      "Next microstep: derive layer offsets, atomic gate orders, and the common boundary slot grid"
    if (this.plannedPlacement && this.batchIndex === 0) {
      detail = `Gate grid planned · ${this.placementBatches.length} region/layer batches remain`
    } else if (this.plannedPlacement && !this.output) {
      const latestBatch = this.placementBatches[this.batchIndex - 1]!
      detail = `Placed region “${latestBatch.regionId}” on layer “${latestBatch.layer}” · ${this.batchIndex}/${this.placementBatches.length} batches`
    } else if (this.output) {
      const sharedGateSlotCount = getSharedGateSlotCount(
        this.output.breakoutPoints,
      )
      detail = `${this.output.breakoutPoints.length} gates placed; coincident layer positions form ${sharedGateSlotCount} shared slots`
    }
    let visualizationState: WindingBreakoutVisualizationState | undefined
    if (this.plannedPlacement) {
      let breakoutPoints: readonly BreakoutPoint[] = this.visibleBreakoutPoints
      if (this.output) breakoutPoints = this.output.breakoutPoints
      visualizationState = {
        referenceOrder: this.params.ordering.referenceOrder,
        breakoutPoints,
        layerByConnection: this.layerByConnection,
      }
    }
    const graphics = createSolverPhaseVisualization({
      input: this.params.input,
      activeLayer: this.visualizationLayer,
      phase: "Step 2 · Place boundary gates",
      detail,
      state: visualizationState,
    })
    const plannedSlotGuides = (this.plannedPlacement?.breakoutPoints ?? [])
      .filter(
        (point) =>
          !this.visualizationLayer ||
          this.layerByConnection[point.connectionId] ===
            this.visualizationLayer,
      )
      .map((point) => ({
        center: point,
        radius: 0.065,
        fill: "rgba(255, 255, 255, 0.75)",
        stroke: "rgba(100, 116, 139, 0.5)",
        label: `planned slot ${point.regionId} · ${this.layerByConnection[point.connectionId]}`,
        layer: getGraphicsLayer(this.params.input, [
          this.layerByConnection[point.connectionId]!,
        ]),
      }))
    return {
      ...graphics,
      circles: [...(graphics.circles ?? []), ...plannedSlotGuides],
    }
  }
}
