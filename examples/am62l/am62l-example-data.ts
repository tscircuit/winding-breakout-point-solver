import type {
  DifferentialPairInput,
  WindingBreakoutExample,
  WindingBreakoutExampleMetadata,
} from "../../lib/types"

interface PortPair {
  readonly id: string
  readonly soc: { readonly x: number; readonly y: number }
  readonly ram: { readonly x: number; readonly y: number }
}

interface ExampleOptions extends WindingBreakoutExampleMetadata {
  readonly ports: readonly PortPair[]
  readonly differentialPairs: readonly DifferentialPairInput[]
  readonly initialLayerByConnection?: Readonly<Record<string, string>>
  readonly initialLayerByBus?: Readonly<
    Record<string, Readonly<Record<string, string>>>
  >
}

export const DDR_BYTE0_PORTS: readonly PortPair[] = [
  { id: "DQ0", soc: { x: -6, y: -3 }, ram: { x: 3.941917, y: -3.650917 } },
  { id: "DQ1", soc: { x: -5.5, y: -3 }, ram: { x: 4.591917, y: -3.650917 } },
  { id: "DQ2", soc: { x: -4.5, y: -3 }, ram: { x: 5.891917, y: -3.650917 } },
  { id: "DQ3", soc: { x: -4.5, y: -3.5 }, ram: { x: 6.541917, y: -3.650917 } },
  { id: "DQ4", soc: { x: -6, y: -2.5 }, ram: { x: 6.541917, y: -2.050917 } },
  { id: "DQ5", soc: { x: -6, y: -2 }, ram: { x: 5.891917, y: -2.050917 } },
  { id: "DQ6", soc: { x: -5, y: -2 }, ram: { x: 4.591917, y: -2.050917 } },
  { id: "DQ7", soc: { x: -5.5, y: -2 }, ram: { x: 3.941917, y: -2.050917 } },
  { id: "DM0", soc: { x: -5, y: -3 }, ram: { x: 4.591917, y: -2.850917 } },
  { id: "DQS0", soc: { x: -4.5, y: -2.5 }, ram: { x: 5.241917, y: -2.850917 } },
  { id: "DQS0_n", soc: { x: -5, y: -2.5 }, ram: { x: 5.891917, y: -2.850917 } },
]

export const DDR_BYTE1_PORTS: readonly PortPair[] = [
  { id: "DQ8", soc: { x: -6, y: 3 }, ram: { x: 3.941917, y: 3.549083 } },
  { id: "DQ9", soc: { x: -5.5, y: 2 }, ram: { x: 4.591917, y: 3.549083 } },
  { id: "DQ10", soc: { x: -4.5, y: 2 }, ram: { x: 5.891917, y: 3.549083 } },
  { id: "DQ11", soc: { x: -4.5, y: 2.5 }, ram: { x: 6.541917, y: 3.549083 } },
  { id: "DQ12", soc: { x: -6, y: 2.5 }, ram: { x: 6.541917, y: 1.949083 } },
  { id: "DQ13", soc: { x: -6.5, y: 3 }, ram: { x: 5.891917, y: 1.949083 } },
  { id: "DQ14", soc: { x: -5, y: 2.5 }, ram: { x: 4.591917, y: 1.949083 } },
  { id: "DQ15", soc: { x: -4.5, y: 3.5 }, ram: { x: 3.941917, y: 1.949083 } },
  { id: "DM1", soc: { x: -5, y: 3.5 }, ram: { x: 4.591917, y: 2.749083 } },
  { id: "DQS1", soc: { x: -4.5, y: 3 }, ram: { x: 5.241917, y: 2.749083 } },
  { id: "DQS1_n", soc: { x: -5, y: 3 }, ram: { x: 5.891917, y: 2.749083 } },
]

export const DDR_ADDR_CTRL_PORTS: readonly PortPair[] = [
  { id: "A0", soc: { x: -6.5, y: -0.5 }, ram: { x: 7.841917, y: -3.650917 } },
  { id: "A1", soc: { x: -7, y: -2 }, ram: { x: 8.491917, y: -3.650917 } },
  { id: "A2", soc: { x: -7, y: -0.5 }, ram: { x: 7.841917, y: 1.949083 } },
  { id: "A3", soc: { x: -5, y: -1 }, ram: { x: 7.841917, y: 2.749083 } },
  { id: "A4", soc: { x: -4.5, y: -1.5 }, ram: { x: 7.841917, y: 3.549083 } },
  { id: "A5", soc: { x: -6.5, y: -2 }, ram: { x: 8.491917, y: 3.549083 } },
  {
    id: "CS0_n",
    soc: { x: -5.5, y: -0.5 },
    ram: { x: 7.841917, y: -2.050917 },
  },
  { id: "CKE0", soc: { x: -4.5, y: -1 }, ram: { x: 8.491917, y: -2.050917 } },
  { id: "CK0", soc: { x: -4.5, y: 1 }, ram: { x: 8.491917, y: 1.149083 } },
  { id: "CK0_n", soc: { x: -5, y: 1 }, ram: { x: 8.491917, y: 1.949083 } },
  {
    id: "DDR_LINK_RESET0_n",
    soc: { x: -5, y: -1.5 },
    ram: { x: 13.041917, y: 3.549083 },
  },
]

export const BYTE0_INITIAL_LAYERS: Readonly<Record<string, string>> = {
  DQ0: "inner3",
  DQ1: "inner6",
  DQ2: "inner5",
  DQ3: "inner2",
  DQ4: "inner3",
  DQ5: "inner2",
  DQ6: "inner5",
  DQ7: "inner4",
  DM0: "inner4",
  DQS0: "inner1",
  DQS0_n: "inner1",
}

export const BYTE1_INITIAL_LAYERS: Readonly<Record<string, string>> = {
  DQ8: "inner6",
  DQ9: "inner3",
  DQ10: "inner3",
  DQ11: "inner6",
  DQ12: "inner5",
  DQ13: "inner2",
  DQ14: "inner5",
  DQ15: "inner4",
  DM1: "inner4",
  DQS1: "inner1",
  DQS1_n: "inner1",
}

export const FULL_INITIAL_LAYERS: Readonly<Record<string, string>> = {
  DQ0: "inner3",
  DQ1: "inner2",
  DQ2: "inner4",
  DQ3: "inner6",
  DQ4: "inner2",
  DQ5: "inner5",
  DQ6: "inner4",
  DQ7: "inner6",
  DM0: "inner5",
  DQS0: "inner1",
  DQS0_n: "inner1",
  DQ8: "inner4",
  DQ9: "inner4",
  DQ10: "inner2",
  DQ11: "inner5",
  DQ12: "inner1",
  DQ13: "inner3",
  DQ14: "inner6",
  DQ15: "inner1",
  DM1: "inner5",
  DQS1: "bottom",
  DQS1_n: "bottom",
  A0: "bottom",
  A1: "inner3",
  A2: "inner3",
  A3: "inner6",
  A4: "inner4",
  A5: "inner2",
  CS0_n: "inner5",
  CKE0: "inner1",
  CK0: "bottom",
  CK0_n: "bottom",
  DDR_LINK_RESET0_n: "inner6",
}

export const ADDR_CTRL_INITIAL_LAYERS: Readonly<Record<string, string>> = {
  A0: "bottom",
  A1: "inner3",
  A2: "inner3",
  A3: "inner6",
  A4: "inner4",
  A5: "inner2",
  CS0_n: "inner5",
  CKE0: "inner1",
  CK0: "bottom",
  CK0_n: "bottom",
  DDR_LINK_RESET0_n: "inner6",
}

const BUS_ORDER = ["DDR_BYTE1", "DDR_ADDR_CTRL", "DDR_BYTE0"] as const
const BUS_BY_CONNECTION: Readonly<Record<string, string>> = Object.fromEntries([
  ...DDR_BYTE1_PORTS.map(({ id }) => [id, "DDR_BYTE1"]),
  ...DDR_ADDR_CTRL_PORTS.map(({ id }) => [id, "DDR_ADDR_CTRL"]),
  ...DDR_BYTE0_PORTS.map(({ id }) => [id, "DDR_BYTE0"]),
])
const BUS_BANDS = {
  DDR_BYTE1: { min: 1.75, max: 4.25, position: "upper" },
  DDR_ADDR_CTRL: { min: -1.25, max: 1.25, position: "center" },
  DDR_BYTE0: { min: -4.25, max: -1.75, position: "lower" },
} as const

export const createAm62lExample = (
  options: ExampleOptions,
): WindingBreakoutExample => {
  const busIds = BUS_ORDER.filter((busId) =>
    options.ports.some(({ id }) => BUS_BY_CONNECTION[id] === busId),
  )

  return {
    sample: {
      id: options.id,
      label: options.label,
      shortLabel: options.shortLabel,
      description: options.description,
      sourceFile: options.sourceFile,
    },
    regions: [
      {
        id: "soc",
        label: "AM62L32",
        subtitle: "U1 · FCCSP-373",
        center: { x: -10, y: 0 },
        component: { width: 11.25616, height: 11.25616 },
        padGrid: {
          columns: 23,
          rows: 23,
          pitchX: 0.5,
          pitchY: 0.5,
          padRadius: 0.12808,
        },
        bounds: {
          minX: -16.62808,
          maxX: -2.37192,
          minY: -10.62808,
          maxY: 10.62808,
        },
        edge: "right",
        ports: options.ports.map(({ id, soc }) => ({
          connectionId: id,
          position: soc,
        })),
      },
      {
        id: "ram",
        label: "MT53E1G16D1ZW",
        subtitle: "U2 · LPDDR4",
        center: { x: 10.116917, y: -0.050917 },
        component: { width: 14.05, height: 9.2 },
        padGrid: {
          columns: 20,
          rows: 12,
          pitchX: 0.65,
          pitchY: 0.8,
          padRadius: 0.2,
        },
        bounds: {
          minX: 1.091917,
          maxX: 18.141917,
          minY: -9.650917,
          maxY: 9.549083,
        },
        edge: "left",
        ports: options.ports.map(({ id, ram }) => ({
          connectionId: id,
          position: ram,
        })),
      },
    ],
    padLayer: "top",
    layerNames: [
      "inner1",
      "inner2",
      "inner3",
      "inner4",
      "inner5",
      "inner6",
      "bottom",
    ],
    stackup: [
      { id: "top", type: "signal" },
      { id: "gnd_top", type: "plane", solid: true, net: "GND" },
      { id: "inner1", type: "signal" },
      { id: "inner2", type: "signal" },
      { id: "gnd_mid_1", type: "plane", solid: true, net: "GND" },
      { id: "inner3", type: "signal" },
      { id: "inner4", type: "signal" },
      { id: "gnd_mid_2", type: "plane", solid: true, net: "GND" },
      { id: "inner5", type: "signal" },
      { id: "inner6", type: "signal" },
      { id: "gnd_bottom", type: "plane", solid: true, net: "GND" },
      { id: "bottom", type: "signal" },
    ],
    boundaryPointSpacing: 0.48,
    breakoutStaggerOffset: 0.24,
    differentialPairs: options.differentialPairs,
    initialLayerByConnection: options.initialLayerByConnection,
    initialLayerByBus: options.initialLayerByBus,
    busLocalOptimization: true,
    busByConnection: Object.fromEntries(
      options.ports.map(({ id }) => [id, BUS_BY_CONNECTION[id] as string]),
    ),
    busIds,
    busBands: Object.fromEntries(
      busIds.map((busId) => [busId, BUS_BANDS[busId]]),
    ),
    preserveWinding: true,
    allowDiagnosticBestEffort: true,
  }
}
