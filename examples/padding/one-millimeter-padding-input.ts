import { fullDdrExample } from "../am62l"
import type { WindingBreakoutSolverInput } from "../../lib/types"

const PADDING_MM = 1

export const oneMillimeterPaddingInput: WindingBreakoutSolverInput = {
  ...fullDdrExample,
  sample: {
    id: "am62l-lpddr4-1mm-padding",
    label: "AM62L + LPDDR4 1mm Padding",
    shortLabel: "1mm Padding",
    description:
      "One millimeter breakout padding around AM62L32 and LPDDR4 RAM with all 33 DDR connections",
    sourceFile: "examples/padding/one-millimeter-padding-input.ts",
  },
  regions: fullDdrExample.regions.map((region) => ({
    ...region,
    bounds: {
      minX: region.center.x - region.component.width / 2 - PADDING_MM,
      maxX: region.center.x + region.component.width / 2 + PADDING_MM,
      minY: region.center.y - region.component.height / 2 - PADDING_MM,
      maxY: region.center.y + region.component.height / 2 + PADDING_MM,
    },
  })),
}
