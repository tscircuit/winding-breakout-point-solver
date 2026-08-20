import {
  BasePipelineSolver,
  type BaseSolver,
  type PipelineStep,
  definePipelineStep,
} from "@tscircuit/solver-utils"
import type { GraphicsObject } from "graphics-debug"
import { WindingBreakoutOutputUnavailableError } from "./input/errors"
import {
  type ValidatedWindingInput,
  validateWindingBreakoutInput,
} from "./input/validate-winding-breakout-input"
import {
  GatePlacementSolver,
  type GatePlacementSolverParams,
} from "./solvers/GatePlacementSolver"
import {
  ReferenceOrderingSolver,
  type ReferenceOrderingResult,
  type ReferenceOrderingSolverParams,
} from "./solvers/ReferenceOrderingSolver"
import type { WindingBreakoutOutput, WindingBreakoutSolverInput } from "./types"
import { finalizeWindingBreakoutOutput } from "./validation/finalize-winding-breakout-output"
import { createSolverPhaseVisualization } from "./visualization/create-solver-phase-visualization"

interface LayerAwareSolver extends BaseSolver {
  setVisualizationLayer(layer?: string): void
}

const PIPELINE_STAGE_NAMES = ["referenceOrdering", "gatePlacement"] as const

export class WindingBreakoutSolver extends BasePipelineSolver<WindingBreakoutSolverInput> {
  private validatedInput?: ValidatedWindingInput
  private output?: WindingBreakoutOutput
  private visualizationLayer?: string

  override pipelineDef: PipelineStep<BaseSolver>[] = [
    definePipelineStep(
      "referenceOrdering",
      ReferenceOrderingSolver,
      (pipeline: WindingBreakoutSolver): [ReferenceOrderingSolverParams] => [
        {
          input: pipeline.inputProblem,
          validated: pipeline.getValidatedInput(),
          visualizationLayer: pipeline.visualizationLayer,
        },
      ],
    ),
    definePipelineStep(
      "gatePlacement",
      GatePlacementSolver,
      (pipeline: WindingBreakoutSolver): [GatePlacementSolverParams] => [
        {
          input: pipeline.inputProblem,
          validated: pipeline.getValidatedInput(),
          ordering:
            pipeline.getRequiredStageOutput<ReferenceOrderingResult>(
              "referenceOrdering",
            ),
          visualizationLayer: pipeline.visualizationLayer,
        },
      ],
    ),
  ]

  constructor(input: WindingBreakoutSolverInput) {
    super(input)
  }

  /** Input validation is fail-fast setup work, not a pipeline stage. */
  override _setup(): void {
    this.validatedInput = validateWindingBreakoutInput(this.inputProblem)
    this.stats = {
      phase: "setup-input-validation",
      regionCount: this.validatedInput.regions.length,
      connectionCount: this.validatedInput.connections.length,
      layerCount: this.validatedInput.layerNames.length,
    }
  }

  private getValidatedInput(): ValidatedWindingInput {
    if (!this.validatedInput) {
      throw new Error("WindingBreakoutSolver: input has not been validated")
    }
    return this.validatedInput
  }

  override _step(): void {
    super._step()
    if (
      !this.output &&
      !this.activeSubSolver &&
      this.currentPipelineStageIndex >= this.pipelineDef.length
    ) {
      this.output = finalizeWindingBreakoutOutput({
        validated: this.getValidatedInput(),
        placement: this.getRequiredStageOutput("gatePlacement"),
      })
      this.solved = true
    }
    this.stats = {
      phase: this.getCurrentStageName(),
      completedStages: this.currentPipelineStageIndex,
      totalStages: this.pipelineDef.length,
    }
    if (this.solved) {
      this.stats.phase = "finalize-output-validation"
    }
    if (this.output) {
      this.stats.valid = true
      this.stats.breakoutPointCount = this.output.breakoutPoints.length
    }
  }

  private getRequiredStageOutput<T>(stageName: string): T {
    const output = this.getStageOutput<T>(stageName)
    if (output === undefined) {
      throw new Error(
        `WindingBreakoutSolver: pipeline stage “${stageName}” has no output`,
      )
    }
    return output
  }

  setVisualizationLayer(layer?: string): void {
    this.visualizationLayer = layer
    for (const stageName of PIPELINE_STAGE_NAMES) {
      const solver = this.getSolver<BaseSolver>(stageName)
      if (solver && "setVisualizationLayer" in solver) {
        ;(solver as LayerAwareSolver).setVisualizationLayer(layer)
      }
    }
  }

  override getConstructorParams(): [WindingBreakoutSolverInput] {
    return [this.inputProblem]
  }

  override getOutput(): WindingBreakoutOutput {
    if (!this.solved || !this.output) {
      throw new WindingBreakoutOutputUnavailableError(
        "WindingBreakoutSolver: getOutput() called before successful completion",
      )
    }
    return this.output
  }

  override initialVisualize(): GraphicsObject {
    return createSolverPhaseVisualization({
      input: this.inputProblem,
      activeLayer: this.visualizationLayer,
      phase: "Input · Validated during setup",
      detail:
        "Region bounds, breakout edges, bus layer preferences, and canonical endpoints",
    })
  }

  override finalVisualize(): GraphicsObject | null {
    if (!this.output) return null
    const ordering =
      this.getRequiredStageOutput<ReferenceOrderingResult>("referenceOrdering")
    return createSolverPhaseVisualization({
      input: this.inputProblem,
      activeLayer: this.visualizationLayer,
      phase: "Output · Validated after gate placement",
      detail:
        "Valid: one bus-constrained breakout point per connection and region; pairs are adjacent",
      state: {
        referenceOrder: ordering.referenceOrder,
        breakoutPoints: this.output.breakoutPoints,
        layerByConnection: this.output.layerByConnection,
      },
    })
  }

  override visualize(): GraphicsObject {
    return {
      ...super.visualize(),
      title: "Winding breakout solver · step-by-step pipeline",
      coordinateSystem: "cartesian",
    }
  }
}
