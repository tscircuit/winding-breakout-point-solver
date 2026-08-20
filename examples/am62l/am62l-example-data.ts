import type {
  ConnectionOrDifferentialPair,
  WindingBreakoutSolverInput,
} from "../../lib/types"

interface PortPair {
  readonly id: string
  readonly layer: string
  readonly fullLayer?: string
  readonly differentialPairId?: string
  readonly soc: { readonly x: number; readonly y: number }
  readonly ram: { readonly x: number; readonly y: number }
}

interface ExampleOptions {
  readonly ports: readonly PortPair[]
  readonly useFullLayers?: boolean
}

export const DDR_BYTE0_PORTS: readonly PortPair[] = [
  {
    id: "DQ0",
    layer: "inner3",
    soc: { x: -6, y: -3 },
    ram: { x: 3.941917, y: -3.650917 },
  },
  {
    id: "DQ1",
    layer: "inner6",
    fullLayer: "inner2",
    soc: { x: -5.5, y: -3 },
    ram: { x: 4.591917, y: -3.650917 },
  },
  {
    id: "DQ2",
    layer: "inner5",
    fullLayer: "inner4",
    soc: { x: -4.5, y: -3 },
    ram: { x: 5.891917, y: -3.650917 },
  },
  {
    id: "DQ3",
    layer: "inner2",
    fullLayer: "inner6",
    soc: { x: -4.5, y: -3.5 },
    ram: { x: 6.541917, y: -3.650917 },
  },
  {
    id: "DQ4",
    layer: "inner3",
    fullLayer: "inner2",
    soc: { x: -6, y: -2.5 },
    ram: { x: 6.541917, y: -2.050917 },
  },
  {
    id: "DQ5",
    layer: "inner2",
    fullLayer: "inner5",
    soc: { x: -6, y: -2 },
    ram: { x: 5.891917, y: -2.050917 },
  },
  {
    id: "DQ6",
    layer: "inner5",
    fullLayer: "inner4",
    soc: { x: -5, y: -2 },
    ram: { x: 4.591917, y: -2.050917 },
  },
  {
    id: "DQ7",
    layer: "inner4",
    fullLayer: "inner6",
    soc: { x: -5.5, y: -2 },
    ram: { x: 3.941917, y: -2.050917 },
  },
  {
    id: "DM0",
    layer: "inner4",
    fullLayer: "inner5",
    soc: { x: -5, y: -3 },
    ram: { x: 4.591917, y: -2.850917 },
  },
  {
    id: "DQS0",
    layer: "inner1",
    differentialPairId: "DQS0",
    soc: { x: -4.5, y: -2.5 },
    ram: { x: 5.241917, y: -2.850917 },
  },
  {
    id: "DQS0_n",
    layer: "inner1",
    differentialPairId: "DQS0",
    soc: { x: -5, y: -2.5 },
    ram: { x: 5.891917, y: -2.850917 },
  },
]

export const DDR_BYTE1_PORTS: readonly PortPair[] = [
  {
    id: "DQ8",
    layer: "inner6",
    fullLayer: "inner4",
    soc: { x: -6, y: 3 },
    ram: { x: 3.941917, y: 3.549083 },
  },
  {
    id: "DQ9",
    layer: "inner3",
    fullLayer: "inner4",
    soc: { x: -5.5, y: 2 },
    ram: { x: 4.591917, y: 3.549083 },
  },
  {
    id: "DQ10",
    layer: "inner3",
    fullLayer: "inner2",
    soc: { x: -4.5, y: 2 },
    ram: { x: 5.891917, y: 3.549083 },
  },
  {
    id: "DQ11",
    layer: "inner6",
    fullLayer: "inner5",
    soc: { x: -4.5, y: 2.5 },
    ram: { x: 6.541917, y: 3.549083 },
  },
  {
    id: "DQ12",
    layer: "inner5",
    fullLayer: "inner1",
    soc: { x: -6, y: 2.5 },
    ram: { x: 6.541917, y: 1.949083 },
  },
  {
    id: "DQ13",
    layer: "inner2",
    fullLayer: "inner3",
    soc: { x: -6.5, y: 3 },
    ram: { x: 5.891917, y: 1.949083 },
  },
  {
    id: "DQ14",
    layer: "inner5",
    fullLayer: "inner6",
    soc: { x: -5, y: 2.5 },
    ram: { x: 4.591917, y: 1.949083 },
  },
  {
    id: "DQ15",
    layer: "inner4",
    fullLayer: "inner1",
    soc: { x: -4.5, y: 3.5 },
    ram: { x: 3.941917, y: 1.949083 },
  },
  {
    id: "DM1",
    layer: "inner4",
    fullLayer: "inner5",
    soc: { x: -5, y: 3.5 },
    ram: { x: 4.591917, y: 2.749083 },
  },
  {
    id: "DQS1",
    layer: "inner1",
    fullLayer: "bottom",
    differentialPairId: "DQS1",
    soc: { x: -4.5, y: 3 },
    ram: { x: 5.241917, y: 2.749083 },
  },
  {
    id: "DQS1_n",
    layer: "inner1",
    fullLayer: "bottom",
    differentialPairId: "DQS1",
    soc: { x: -5, y: 3 },
    ram: { x: 5.891917, y: 2.749083 },
  },
]

export const DDR_ADDR_CTRL_PORTS: readonly PortPair[] = [
  {
    id: "A0",
    layer: "bottom",
    soc: { x: -6.5, y: -0.5 },
    ram: { x: 7.841917, y: -3.650917 },
  },
  {
    id: "A1",
    layer: "inner3",
    soc: { x: -7, y: -2 },
    ram: { x: 8.491917, y: -3.650917 },
  },
  {
    id: "A2",
    layer: "inner3",
    soc: { x: -7, y: -0.5 },
    ram: { x: 7.841917, y: 1.949083 },
  },
  {
    id: "A3",
    layer: "inner6",
    soc: { x: -5, y: -1 },
    ram: { x: 7.841917, y: 2.749083 },
  },
  {
    id: "A4",
    layer: "inner4",
    soc: { x: -4.5, y: -1.5 },
    ram: { x: 7.841917, y: 3.549083 },
  },
  {
    id: "A5",
    layer: "inner2",
    soc: { x: -6.5, y: -2 },
    ram: { x: 8.491917, y: 3.549083 },
  },
  {
    id: "CS0_n",
    layer: "inner5",
    soc: { x: -5.5, y: -0.5 },
    ram: { x: 7.841917, y: -2.050917 },
  },
  {
    id: "CKE0",
    layer: "inner1",
    soc: { x: -4.5, y: -1 },
    ram: { x: 8.491917, y: -2.050917 },
  },
  {
    id: "CK0",
    layer: "bottom",
    differentialPairId: "CK0",
    soc: { x: -4.5, y: 1 },
    ram: { x: 8.491917, y: 1.149083 },
  },
  {
    id: "CK0_n",
    layer: "bottom",
    differentialPairId: "CK0",
    soc: { x: -5, y: 1 },
    ram: { x: 8.491917, y: 1.949083 },
  },
  {
    id: "DDR_LINK_RESET0_n",
    layer: "inner6",
    soc: { x: -5, y: -1.5 },
    ram: { x: 13.041917, y: 3.549083 },
  },
]

export const createAm62lExample = (
  options: ExampleOptions,
): WindingBreakoutSolverInput => {
  const addedPairIds = new Set<string>()
  const getLayer = (port: PortPair): string => {
    if (!options.useFullLayers) return port.layer
    if (port.fullLayer !== undefined) return port.fullLayer
    return port.layer
  }
  const makeEndpoints = (port: PortPair) => [
    { regionId: "soc", position: port.soc },
    { regionId: "ram", position: port.ram },
  ]
  const connections: ConnectionOrDifferentialPair[] = []
  for (const port of options.ports) {
    if (!port.differentialPairId) {
      connections.push({
        id: port.id,
        layer: getLayer(port),
        endpoints: makeEndpoints(port),
      })
      continue
    }
    if (addedPairIds.has(port.differentialPairId)) continue
    addedPairIds.add(port.differentialPairId)
    const pair = options.ports.filter(
      (candidate) => candidate.differentialPairId === port.differentialPairId,
    )
    if (pair.length !== 2) {
      throw new Error(
        `Differential pair ${port.differentialPairId} must have two members`,
      )
    }
    const [first, second] = pair as [PortPair, PortPair]
    const layer = getLayer(first)
    if (getLayer(second) !== layer) {
      throw new Error(`Differential pair ${first.id}/${second.id} spans layers`)
    }
    connections.push({
      type: "differential",
      layer,
      connections: [
        { id: first.id, endpoints: makeEndpoints(first) },
        { id: second.id, endpoints: makeEndpoints(second) },
      ],
    })
  }

  return {
    regions: [
      {
        id: "soc",
        bounds: {
          minX: -16.62808,
          maxX: -2.37192,
          minY: -10.62808,
          maxY: 10.62808,
        },
        edge: "right",
      },
      {
        id: "ram",
        bounds: {
          minX: 1.091917,
          maxX: 18.141917,
          minY: -9.650917,
          maxY: 9.549083,
        },
        edge: "left",
      },
    ],
    connections,
    boundaryPointSpacing: 0.48,
  }
}
