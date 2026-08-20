import { BaseSolver } from "@tscircuit/solver-utils"
import type { GraphicsObject } from "graphics-debug"
import {
  WindingBreakoutInvariantError,
  WindingBreakoutOutputUnavailableError,
} from "./input/errors"
import {
  type ValidatedWindingInput,
  validateWindingBreakoutInput,
} from "./input/validate-winding-breakout-input"
import { solveWindingBreakout } from "./solve-winding-breakout"
import type { WindingBreakoutOutput, WindingBreakoutSolverInput } from "./types"
import { createWindingBreakoutVisualization } from "./visualization/create-winding-breakout-visualization"

export class WindingBreakoutSolver extends BaseSolver {
  private readonly input: WindingBreakoutSolverInput
  private validatedInput?: ValidatedWindingInput
  private output?: WindingBreakoutOutput
  private visualizationLayer?: string

  constructor(input: WindingBreakoutSolverInput) {
    super()
    this.input = input
  }

  setVisualizationLayer(layer?: string): void {
    this.visualizationLayer = layer
  }

  override _setup(): void {
    this.validatedInput = validateWindingBreakoutInput(this.input)
    this.MAX_ITERATIONS = 1
    this.stats = {
      phase: "place-breakpoints",
      connectionCount: this.validatedInput.connections.length,
      placedBreakpoints: 0,
    }
  }

  override _step(): void {
    if (!this.validatedInput) {
      throw new WindingBreakoutInvariantError(
        "WindingBreakoutSolver: setup did not validate the input",
      )
    }
    this.output = solveWindingBreakout(this.input, this.validatedInput)
    this.stats = {
      ...this.stats,
      phase: "complete",
      placedBreakpoints: this.output.breakoutPoints.length,
      validBreakpoints: this.output.validation.valid,
    }
    this.solved = true
  }

  computeProgress(): number {
    if (this.solved) return 1
    return 0
  }

  override getConstructorParams(): [WindingBreakoutSolverInput] {
    return [this.input]
  }

  override getOutput(): WindingBreakoutOutput {
    if (!this.solved || !this.output) {
      throw new WindingBreakoutOutputUnavailableError(
        "WindingBreakoutSolver: getOutput() called before successful completion",
      )
    }
    return this.output
  }

  override visualize(): GraphicsObject {
    return createWindingBreakoutVisualization(
      this.input,
      this.output,
      this.visualizationLayer,
    )
  }
}
