import { fullDdrExample } from "../am62l"
import type { WindingBreakoutSolverInput } from "../../lib/types"

export const oneMillimeterPaddingInput: WindingBreakoutSolverInput = {
  regions: [
    {
      id: "soc",
      bounds: {
        minX: -16.62808,
        maxX: -3.37192,
        minY: -6.62808,
        maxY: 6.62808,
      },
      edge: "right",
    },
    {
      id: "ram",
      bounds: {
        minX: 2.091917,
        maxX: 18.141917,
        minY: -5.650917,
        maxY: 5.549083,
      },
      edge: "left",
    },
  ],
  connections: fullDdrExample.connections,
  boundaryPointSpacing: fullDdrExample.boundaryPointSpacing,
}
