import { createWindingBreakoutInputFromCircuitJson } from "../../lib"
import type { WindingBreakoutExample } from "../../lib/types"
import { AM62L_LPDDR4_THREE_MM_CIRCUIT_JSON } from "./am62l-lpddr4-three-mm-circuit-json.generated"

export const createThreeMillimeterPaddingExample =
  async (): Promise<WindingBreakoutExample> => ({
    ...createWindingBreakoutInputFromCircuitJson({
      circuitJson: AM62L_LPDDR4_THREE_MM_CIRCUIT_JSON,
    }),
    sample: {
      id: "am62l-lpddr4-3mm-padding",
      label: "AM62L + LPDDR4 3mm Padding",
      shortLabel: "3mm Padding",
      description:
        "Core-rendered 3mm breakout padding around AM62L32 and LPDDR4 RAM",
      sourceFile: "examples/padding/am62l-lpddr4-three-mm-circuit.tsx",
    },
  })
