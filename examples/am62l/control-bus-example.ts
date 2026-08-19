import {
  ADDR_CTRL_INITIAL_LAYERS,
  createAm62lExample,
  DDR_ADDR_CTRL_PORTS,
} from "./am62l-example-data"

export const controlBusExample = createAm62lExample({
  id: "control-bus",
  label: "Control Bus",
  shortLabel: "Control Bus",
  description: "11-net DDR address and control bus",
  sourceFile: "control-bus.circuit.tsx",
  ports: DDR_ADDR_CTRL_PORTS,
  initialLayerByConnection: ADDR_CTRL_INITIAL_LAYERS,
  differentialPairs: [
    { positive: "CK0", negative: "CK0_n", targetSpacing: 0.48 },
  ],
})
