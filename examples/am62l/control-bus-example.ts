import { createAm62lExample } from "./am62l-example-data"

export const createControlBusExample = () =>
  createAm62lExample({
    id: "control-bus",
    label: "Control Bus",
    shortLabel: "Control Bus",
    description: "11-net DDR address and control bus",
    sourceFile: "examples/am62l/am62l-circuit.tsx",
    buses: ["DDR_ADDR_CTRL"],
  })
