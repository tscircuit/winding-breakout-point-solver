import type { GraphicsObject } from "graphics-debug"
import type {
  WindingBreakoutDiagnosticOutput,
  WindingBreakoutOutput,
  WindingBreakoutSolverInput,
} from "../types"
import { createInputGraphics } from "./create-input-graphics"
import { createStateGraphics } from "./create-state-graphics"

/** Compose the solver-native, layer-aware winding breakout debug view. */
export const createWindingBreakoutVisualization = (
  input: WindingBreakoutSolverInput,
  state?: WindingBreakoutOutput | WindingBreakoutDiagnosticOutput,
  activeLayer?: string,
): GraphicsObject => {
  const inputGraphics = createInputGraphics(input, activeLayer)
  const stateGraphics = state
    ? createStateGraphics(input, state, activeLayer)
    : {}
  return {
    title:
      state?.solved === false
        ? "Winding breakout diagnostic (unsolved)"
        : "Winding breakout solver",
    coordinateSystem: "cartesian",
    rects: inputGraphics.rects,
    polygons: inputGraphics.polygons,
    lines: stateGraphics.lines,
    circles: [
      ...(inputGraphics.circles ?? []),
      ...(stateGraphics.circles ?? []),
    ],
    points: stateGraphics.points,
    texts: [...(inputGraphics.texts ?? []), ...(stateGraphics.texts ?? [])],
  }
}
