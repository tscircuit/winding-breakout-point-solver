import {
  BYTE1_INITIAL_LAYERS,
  createAm62lExample,
  DDR_BYTE1_PORTS,
} from "./am62l-example-data"

export const ddrByte1Example = createAm62lExample({
  id: "byte1",
  label: "Data Bus 2",
  shortLabel: "Data Bus 2",
  description: "11-net DQ8–DQ15 byte lane",
  sourceFile: "ddr-byte1-only.circuit.tsx",
  ports: DDR_BYTE1_PORTS,
  initialLayerByConnection: BYTE1_INITIAL_LAYERS,
  differentialPairs: [
    { positive: "DQS1", negative: "DQS1_n", targetSpacing: 0.48 },
  ],
})
