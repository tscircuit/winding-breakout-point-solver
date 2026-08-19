import { createAm62lExample } from "./am62l-example-data"

export const createDdrByte1Example = () =>
  createAm62lExample({
    id: "byte1",
    label: "Data Bus 2",
    shortLabel: "Data Bus 2",
    description: "11-net DQ8–DQ15 byte lane",
    sourceFile: "examples/am62l/am62l-circuit.tsx",
    buses: ["DDR_BYTE1"],
  })
