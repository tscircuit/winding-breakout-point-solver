import {
  ADDR_CTRL_INITIAL_LAYERS,
  BYTE0_INITIAL_LAYERS,
  BYTE1_INITIAL_LAYERS,
  createAm62lExample,
  DDR_ADDR_CTRL_PORTS,
  DDR_BYTE0_PORTS,
  DDR_BYTE1_PORTS,
  FULL_INITIAL_LAYERS,
} from "./am62l-example-data"

export const fullDdrExample = createAm62lExample({
  id: "full",
  label: "All Buses",
  shortLabel: "All Buses",
  description: "33-net byte 0 + byte 1 + address/control",
  sourceFile: "index.circuit.tsx",
  ports: [...DDR_BYTE0_PORTS, ...DDR_BYTE1_PORTS, ...DDR_ADDR_CTRL_PORTS],
  initialLayerByConnection: FULL_INITIAL_LAYERS,
  initialLayerByBus: {
    DDR_BYTE0: BYTE0_INITIAL_LAYERS,
    DDR_BYTE1: BYTE1_INITIAL_LAYERS,
    DDR_ADDR_CTRL: ADDR_CTRL_INITIAL_LAYERS,
  },
  differentialPairs: [
    { positive: "DQS0", negative: "DQS0_n", targetSpacing: 0.48 },
    { positive: "DQS1", negative: "DQS1_n", targetSpacing: 0.48 },
    { positive: "CK0", negative: "CK0_n", targetSpacing: 0.48 },
  ],
})
