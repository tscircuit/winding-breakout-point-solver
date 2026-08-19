import { BaseSolver } from "@tscircuit/solver-utils"
import type { GraphicsObject } from "graphics-debug"
import { combineBreakoutResults } from "./combine-breakout-results"
import {
  WindingBreakoutInvariantError,
  WindingBreakoutOutputUnavailableError,
} from "./input/errors"
import {
  type ValidatedWindingInput,
  validateWindingBreakoutInput,
} from "./input/validate-winding-breakout-input"
import { solveBreakoutBus } from "./solve-breakout-bus"
import type {
  WindingBreakoutBusResult,
  WindingBreakoutDiagnosticOutput,
  WindingBreakoutOutput,
  WindingBreakoutSolverInput,
} from "./types"
import { createWindingBreakoutVisualization } from "./visualization/create-winding-breakout-visualization"

type SolverPhase = "place-breakpoints" | "combine" | "complete"

export class WindingBreakoutSolver extends BaseSolver {
  private readonly input: WindingBreakoutSolverInput
  private validatedInput?: ValidatedWindingInput
  private phase: SolverPhase = "place-breakpoints"
  private nextBusIndex = 0
  private readonly busResults: Record<string, WindingBreakoutBusResult> = {}
  private output?: WindingBreakoutOutput
  private diagnosticOutput?: WindingBreakoutDiagnosticOutput
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
    this.MAX_ITERATIONS = this.validatedInput.busIds.length + 2
    this.stats = {
      phase: this.phase,
      completedBuses: 0,
      totalBuses: this.validatedInput.busIds.length,
      placedBreakpoints: 0,
    }
  }

  override _step(): void {
    const validated = this.validatedInput
    if (!validated) {
      throw new WindingBreakoutInvariantError(
        "WindingBreakoutSolver: setup did not validate the input",
      )
    }
    if (this.phase === "place-breakpoints") {
      const busId = validated.busIds[this.nextBusIndex]
      if (!busId) {
        this.phase = "combine"
        return
      }
      const connectionIds = validated.connectionIds.filter(
        (connectionId) => validated.busByConnection[connectionId] === busId,
      )
      this.busResults[busId] = solveBreakoutBus({
        input: this.input,
        busId,
        band: validated.busBands[busId]!,
        connectionIds,
      })
      this.nextBusIndex++
      this.stats = {
        phase: this.phase,
        activeBus: busId,
        completedBuses: this.nextBusIndex,
        totalBuses: validated.busIds.length,
        placedBreakpoints: Object.values(this.busResults).reduce(
          (sum, result) => sum + result.breakoutPoints.length,
          0,
        ),
      }
      if (this.nextBusIndex >= validated.busIds.length) this.phase = "combine"
      return
    }
    if (this.phase === "combine") {
      const combined = combineBreakoutResults({
        input: this.input,
        busIds: validated.busIds,
        busBands: validated.busBands,
        busByConnection: validated.busByConnection,
        busResults: this.busResults,
      })
      this.phase = "complete"
      this.stats = {
        ...this.stats,
        phase: this.phase,
        validBreakpoints: combined.validation.valid,
      }
      if (combined.solved) {
        this.output = combined
        this.solved = true
      } else {
        this.diagnosticOutput = combined
        this.failed = true
        this.error = `WindingBreakoutSolver: ${combined.unresolvedReasons.join("; ")}`
      }
      return
    }
    throw new WindingBreakoutInvariantError(
      "WindingBreakoutSolver: stepped after terminal combination",
    )
  }

  computeProgress(): number {
    if (this.solved || this.failed || this.phase === "complete") return 1
    const busCount = this.validatedInput?.busIds.length ?? 1
    if (this.phase === "combine") return busCount / (busCount + 1)
    return this.nextBusIndex / (busCount + 1)
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

  getDiagnosticOutput(): WindingBreakoutDiagnosticOutput {
    if (!this.failed || !this.diagnosticOutput) {
      throw new WindingBreakoutOutputUnavailableError(
        "WindingBreakoutSolver: diagnostic output is only available after a diagnostic failure",
      )
    }
    return this.diagnosticOutput
  }

  override visualize(): GraphicsObject {
    return createWindingBreakoutVisualization(
      this.input,
      this.output ?? this.diagnosticOutput,
      this.visualizationLayer,
    )
  }
}
