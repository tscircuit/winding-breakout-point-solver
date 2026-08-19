import {
  BYTE0_INITIAL_LAYERS,
  createAm62lExample,
  DDR_BYTE0_PORTS,
} from "./am62l-example-data"

export const ddrByte0Example = createAm62lExample({
  id: "byte0",
  label: "Data Bus 1",
  shortLabel: "Data Bus 1",
  description: "11-net DQ0–DQ7 byte lane",
  sourceFile: "ddr-byte0-only.circuit.tsx",
  ports: DDR_BYTE0_PORTS,
  initialLayerByConnection: BYTE0_INITIAL_LAYERS,
  differentialPairs: [
    { positive: "DQS0", negative: "DQS0_n", targetSpacing: 0.48 },
  ],
})
