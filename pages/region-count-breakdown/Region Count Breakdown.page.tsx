import {
  oneRegionExample,
  threeRegionExample,
  twoRegionExample,
} from "../../examples/region-count"
import { WindingBreakoutSolverFixture } from "../am62l-lpddr4-ram/WindingBreakoutSolverFixture"
import { OneRegionDestinationVisualizationSolver } from "./OneRegionDestinationVisualizationSolver"

export default {
  "1 Region · Step-by-step": (
    <WindingBreakoutSolverFixture
      input={oneRegionExample}
      createSolver={(input) =>
        new OneRegionDestinationVisualizationSolver(input)
      }
    />
  ),
  "2 Regions · Step-by-step": (
    <WindingBreakoutSolverFixture input={twoRegionExample} />
  ),
  "3 Regions · Step-by-step": (
    <WindingBreakoutSolverFixture input={threeRegionExample} />
  ),
}
