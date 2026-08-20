import type { GraphicsObject } from "graphics-debug"
import type {
  WindingBreakoutOutput,
  WindingBreakoutSolverInput,
} from "../types"
import { createInputGraphics } from "./create-input-graphics"
import { createStateGraphics } from "./create-state-graphics"

/** Compose the solver-native, layer-aware winding breakout debug view. */
export const createWindingBreakoutVisualization = (
  input: WindingBreakoutSolverInput,
  state?: WindingBreakoutOutput,
  activeLayer?: string,
): GraphicsObject => {
  const inputGraphics = createInputGraphics(input, activeLayer)
  const stateGraphics = state
    ? createStateGraphics(input, state, activeLayer)
    : {}
  return {
    title: "Winding breakout solver",
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
