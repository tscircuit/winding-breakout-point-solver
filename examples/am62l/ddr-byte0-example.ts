import { createAm62lExample, DDR_BYTE0_PORTS } from "./am62l-example-data"

export const ddrByte0Example = createAm62lExample({
  buses: [
    {
      id: "DDR_BYTE0",
      ports: DDR_BYTE0_PORTS,
      preferredLayers: ["inner1", "inner4"],
    },
  ],
})
