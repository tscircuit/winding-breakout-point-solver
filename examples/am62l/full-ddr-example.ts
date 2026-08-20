import {
  createAm62lExample,
  DDR_ADDR_CTRL_PORTS,
  DDR_BYTE0_PORTS,
  DDR_BYTE1_PORTS,
} from "./am62l-example-data"

export const fullDdrExample = createAm62lExample({
  buses: [
    {
      id: "DDR_BYTE0",
      ports: DDR_BYTE0_PORTS,
      preferredLayers: ["inner1", "inner4"],
    },
    {
      id: "DDR_BYTE1",
      ports: DDR_BYTE1_PORTS,
      preferredLayers: ["inner2", "inner5"],
    },
    {
      id: "DDR_ADDR_CTRL",
      ports: DDR_ADDR_CTRL_PORTS,
      preferredLayers: ["inner3", "inner6"],
    },
  ],
})
