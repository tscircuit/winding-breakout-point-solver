import {
  createControlBusExample,
  createDdrByte0Example,
  createDdrByte1Example,
  createFullDdrExample,
} from "../../examples/am62l"
import { WindingBreakoutSolverFixture } from "./WindingBreakoutSolverFixture"

export default {
  "Data Bus 1": (
    <WindingBreakoutSolverFixture loadExample={createDdrByte0Example} />
  ),
  "Data Bus 2": (
    <WindingBreakoutSolverFixture loadExample={createDdrByte1Example} />
  ),
  "Control Bus": (
    <WindingBreakoutSolverFixture loadExample={createControlBusExample} />
  ),
  "All Buses": (
    <WindingBreakoutSolverFixture loadExample={createFullDdrExample} />
  ),
}
