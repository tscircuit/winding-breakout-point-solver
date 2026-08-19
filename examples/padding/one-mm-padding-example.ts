import { createWindingBreakoutInputFromCircuitJson } from "../../lib"
import type { WindingBreakoutExample } from "../../lib/types"
import { AM62L_LPDDR4_ONE_MM_CIRCUIT_JSON } from "./am62l-lpddr4-one-mm-circuit-json.generated"

export const createOneMillimeterPaddingExample =
  async (): Promise<WindingBreakoutExample> => ({
    ...createWindingBreakoutInputFromCircuitJson({
      circuitJson: AM62L_LPDDR4_ONE_MM_CIRCUIT_JSON,
    }),
    sample: {
      id: "am62l-lpddr4-1mm-padding",
      label: "AM62L + LPDDR4 1mm Padding",
      shortLabel: "1mm Padding",
      description:
        "Core-rendered 1mm breakout padding around AM62L32 and LPDDR4 RAM with all 33 DDR connections",
      sourceFile: "examples/padding/am62l-lpddr4-one-mm-circuit.tsx",
    },
  })
