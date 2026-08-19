import { createAm62lExample } from "./am62l-example-data"

export const createDdrByte0Example = () =>
  createAm62lExample({
    id: "byte0",
    label: "Data Bus 1",
    shortLabel: "Data Bus 1",
    description: "11-net DQ0–DQ7 byte lane",
    sourceFile: "examples/am62l/am62l-circuit.tsx",
    buses: ["DDR_BYTE0"],
  })
