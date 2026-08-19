import type { WindingBreakoutExample } from "../../lib/types"
import { createFullDdrExample } from "../am62l/full-ddr-example"

export const createThreeMillimeterPaddingExample =
  async (): Promise<WindingBreakoutExample> => {
    const example = await createFullDdrExample()

    return {
      ...example,
      sample: {
        id: "am62l-lpddr4-3mm-padding",
        label: "AM62L + LPDDR4 3mm Padding",
        shortLabel: "3mm Padding",
        description:
          "Uniform 3mm breakout padding around AM62L32 and LPDDR4 RAM",
        sourceFile: "examples/am62l/am62l-circuit.tsx",
      },
    }
  }
