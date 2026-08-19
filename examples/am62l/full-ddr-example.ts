import { createAm62lExample } from "./am62l-example-data"

export const createFullDdrExample = () =>
  createAm62lExample({
    id: "full",
    label: "All Buses",
    shortLabel: "All Buses",
    description: "33-net byte 0 + byte 1 + address/control",
    sourceFile: "examples/am62l/am62l-circuit.tsx",
    buses: ["DDR_BYTE0", "DDR_BYTE1", "DDR_ADDR_CTRL"],
  })
