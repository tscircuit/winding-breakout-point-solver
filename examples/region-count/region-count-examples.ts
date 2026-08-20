import type {
  ConnectionOrDifferentialPair,
  Point,
  WindingBreakoutRegion,
  WindingBreakoutSolverInput,
} from "../../lib/types"

const regionCatalog = {
  source: {
    id: "source",
    bounds: { minX: -8, maxX: -4, minY: -3, maxY: 3 },
    edge: "right",
  },
  middle: {
    id: "middle",
    bounds: { minX: -2, maxX: 2, minY: -2.75, maxY: 2.75 },
    edge: "left",
  },
  target: {
    id: "target",
    bounds: { minX: 4, maxX: 8, minY: -3.25, maxY: 3.25 },
    edge: "left",
  },
} as const satisfies Record<string, WindingBreakoutRegion>

const positionsByRegion = {
  source: {
    DATA0: { x: -6, y: -1.6 },
    CLK_P: { x: -6, y: -0.55 },
    CTRL: { x: -5.2, y: 0 },
    CLK_N: { x: -6, y: 0.55 },
    DATA1: { x: -6, y: 1.6 },
  },
  middle: {
    DATA0: { x: 0, y: 1.45 },
    CLK_P: { x: 0, y: 0.5 },
    CTRL: { x: 0.8, y: 0 },
    CLK_N: { x: 0, y: -0.5 },
    DATA1: { x: 0, y: -1.45 },
  },
  target: {
    DATA0: { x: 6, y: -1.25 },
    CLK_P: { x: 6, y: 0.65 },
    CTRL: { x: 6.8, y: 0 },
    CLK_N: { x: 6, y: -0.65 },
    DATA1: { x: 6, y: 1.25 },
  },
} as const satisfies Record<string, Record<string, Point>>

type ExampleConnectionId = keyof (typeof positionsByRegion)["source"]

export interface ExternalConnectionDestination {
  readonly connectionId: ExampleConnectionId
  readonly position: Point
}

/** Visualization-only destinations that are intentionally outside any region. */
export const oneRegionExternalDestinations: readonly ExternalConnectionDestination[] =
  [
    { connectionId: "DATA0", position: { x: -7.75, y: -2 } },
    { connectionId: "CLK_P", position: { x: -7.75, y: -1 } },
    { connectionId: "CTRL", position: { x: -7.75, y: 0 } },
    { connectionId: "CLK_N", position: { x: -7.75, y: 1 } },
    { connectionId: "DATA1", position: { x: -7.75, y: 2 } },
  ]

const makeConnections = (
  regionIds: readonly (keyof typeof regionCatalog)[],
): ConnectionOrDifferentialPair[] => {
  const endpoints = (connectionId: ExampleConnectionId) =>
    regionIds.map((regionId) => ({
      regionId,
      position: positionsByRegion[regionId][connectionId]!,
    }))

  // Deliberately not in geometric order: reference order must come from pads.
  return [
    { id: "CTRL", layer: "inner1", endpoints: endpoints("CTRL") },
    {
      type: "differential",
      layer: "inner2",
      connections: [
        { id: "CLK_P", endpoints: endpoints("CLK_P") },
        { id: "CLK_N", endpoints: endpoints("CLK_N") },
      ],
    },
    { id: "DATA1", layer: "inner1", endpoints: endpoints("DATA1") },
    { id: "DATA0", layer: "inner1", endpoints: endpoints("DATA0") },
  ]
}

const makeExample = (
  regionIds: readonly (keyof typeof regionCatalog)[],
): WindingBreakoutSolverInput => ({
  regions: regionIds.map((regionId) => regionCatalog[regionId]),
  connections: makeConnections(regionIds),
  boundaryPointSpacing: 0.5,
})

export const oneRegionExample: WindingBreakoutSolverInput = {
  ...makeExample(["source"]),
  regions: [
    {
      ...regionCatalog.source,
      bounds: { minX: -7, maxX: -5, minY: -3, maxY: 3 },
      edge: "left",
    },
  ],
}
export const twoRegionExample = makeExample(["source", "middle"])
export const threeRegionExample = makeExample(["source", "middle", "target"])
