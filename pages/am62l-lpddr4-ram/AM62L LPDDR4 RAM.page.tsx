import {
  controlBusExample,
  ddrByte0Example,
  ddrByte1Example,
  fullDdrExample,
} from "../../examples/am62l"
import { WindingBreakoutSolverFixture } from "./WindingBreakoutSolverFixture"

export default {
  "Data Bus 1": <WindingBreakoutSolverFixture example={ddrByte0Example} />,
  "Data Bus 2": <WindingBreakoutSolverFixture example={ddrByte1Example} />,
  "Control Bus": <WindingBreakoutSolverFixture example={controlBusExample} />,
  "All Buses": <WindingBreakoutSolverFixture example={fullDdrExample} />,
}
