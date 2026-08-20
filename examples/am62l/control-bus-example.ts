import { createAm62lExample, DDR_ADDR_CTRL_PORTS } from "./am62l-example-data"

export const controlBusExample = createAm62lExample({
  buses: [
    {
      id: "DDR_ADDR_CTRL",
      ports: DDR_ADDR_CTRL_PORTS,
      preferredLayers: ["inner3", "inner6"],
    },
  ],
})
