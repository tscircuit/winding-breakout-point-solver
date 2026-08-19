import {
  controlBusExample,
  ddrByte0Example,
  ddrByte1Example,
  fullDdrExample,
} from "../../examples/am62l"
import { WindingBreakoutSolverFixture } from "./WindingBreakoutSolverFixture"

export default {
  "Data Bus 1": <WindingBreakoutSolverFixture input={ddrByte0Example} />,
  "Data Bus 2": <WindingBreakoutSolverFixture input={ddrByte1Example} />,
  "Control Bus": <WindingBreakoutSolverFixture input={controlBusExample} />,
  "All Buses": <WindingBreakoutSolverFixture input={fullDdrExample} />,
}
