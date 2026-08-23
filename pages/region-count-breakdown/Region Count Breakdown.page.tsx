import {
  oneRegionExample,
  threeRegionExample,
  twoRegionExample,
} from "../../examples/region-count"
import { WindingBreakoutSolverFixture } from "../am62l-lpddr4-ram/WindingBreakoutSolverFixture"

export default {
  "1 Region · Step-by-step": (
    <WindingBreakoutSolverFixture input={oneRegionExample} />
  ),
  "2 Regions · Step-by-step": (
    <WindingBreakoutSolverFixture input={twoRegionExample} />
  ),
  "3 Regions · Step-by-step": (
    <WindingBreakoutSolverFixture input={threeRegionExample} />
  ),
}
