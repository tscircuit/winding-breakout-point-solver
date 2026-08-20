import { createAm62lExample, DDR_BYTE1_PORTS } from "./am62l-example-data"

export const ddrByte1Example = createAm62lExample({
  buses: [
    {
      id: "DDR_BYTE1",
      ports: DDR_BYTE1_PORTS,
      preferredLayers: ["inner2", "inner5"],
    },
  ],
})
