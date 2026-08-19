import type { WindingBreakoutExample } from "../../lib/types"
import { createFullDdrExample } from "../am62l/full-ddr-example"

export const createAsymmetricPaddingExample =
  async (): Promise<WindingBreakoutExample> => {
    const example = await createFullDdrExample()

    return {
      ...example,
      sample: {
        id: "am62l-lpddr4-padding",
        label: "AM62L + LPDDR4 Padding",
        shortLabel: "Padding",
        description:
          "Mirrored asymmetric breakout padding around AM62L32 and LPDDR4 RAM",
        sourceFile: "examples/am62l/am62l-circuit.tsx",
      },
    }
  }
