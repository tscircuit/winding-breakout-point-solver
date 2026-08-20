import {
  createAm62lExample,
  DDR_ADDR_CTRL_PORTS,
  DDR_BYTE0_PORTS,
  DDR_BYTE1_PORTS,
} from "./am62l-example-data"

export const fullDdrExample = createAm62lExample({
  ports: [...DDR_BYTE0_PORTS, ...DDR_BYTE1_PORTS, ...DDR_ADDR_CTRL_PORTS],
  useFullLayers: true,
})
