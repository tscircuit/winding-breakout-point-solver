import { createAsymmetricPaddingExample } from "../../examples/padding/asymmetric-padding-example"
import { WindingBreakoutSolverFixture } from "../am62l-lpddr4-ram/WindingBreakoutSolverFixture"

export default {
  "Asymmetric Padding": (
    <WindingBreakoutSolverFixture
      loadExample={createAsymmetricPaddingExample}
    />
  ),
}
