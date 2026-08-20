# @tscircuit/winding-breakout-point-solver

A typed, deterministic solver for placing winding-aware breakout points on one
or more declared region boundaries. The caller declares every connection once,
one endpoint per region, and the buses that constrain layer assignment. The
solver derives winding order, selected layers, and staggered boundary points;
it does not generate traces, dogbones, or vias.

The package is currently private.

## Input API

`connections` is the single source of truth for connection IDs and endpoint
positions. `buses` carries routing-group membership and layer constraints.

```ts
type WindingBreakoutSolverInput = {
  regions: readonly {
    id: string
    bounds: Bounds
    edge: "left" | "right" | "bottom" | "top"
  }[]
  connections: readonly ConnectionOrDifferentialPair[]
  buses: readonly WindingBreakoutBusInput[]
  boundaryPointSpacing: number
}

type ConnectionInput = {
  id: string
  endpoints: readonly {
    regionId: string
    position: Point
  }[]
}

type DifferentialPairInput = {
  type: "differential"
  connections: readonly [ConnectionInput, ConnectionInput]
}

type WindingBreakoutBusInput = {
  id: string
  connectionIds: readonly string[]
  preferredLayer?: string
  preferredLayers?: readonly string[]
}
```

At least one region is required. Every connection must have exactly one endpoint
for every declared region.
Differential-pair members must belong to the same bus, select the same layer,
and remain adjacent in the breakout order. Despite its legacy name,
`preferredLayer` is a permanent assignment. `preferredLayers` is the ordered
candidate set that the solver may distribute a bus over.

Every input field carries caller-owned information:

- region IDs and connection IDs are stable join keys;
- bounds and the selected edge define the allowed breakout geometry;
- endpoint region IDs make the join explicit instead of coupling two arrays by
  position;
- endpoint positions define the winding, while buses and differential-pair
  membership are routing constraints; and
- `boundaryPointSpacing` is the requested physical spacing.

Region centers, the layer list, winding orders, and layer stagger offsets are
derived by the solver and are not accepted as input.

## Output API

The successful result contains only the calculated coordinates and the two
join keys needed to associate each point with the input:

```ts
type WindingBreakoutOutput = {
  breakoutPoints: readonly {
    regionId: string
    connectionId: string
    x: number
    y: number
  }[]
  layerByConnection: Readonly<Record<string, string>>
}
```

The selected layer is returned once per connection instead of being copied onto
every regional point.
Successful `getOutput()` already proves that the solver completed and its
invariants passed, so the result does not repeat a `solved` flag or validation
report. Reference/natural orders, slot indexes, layer offsets, layer/region
order tables, and shared-slot groups are deterministic intermediate values and
are likewise omitted.

## Usage

```ts
import {
  WindingBreakoutSolver,
  type WindingBreakoutSolverInput,
} from "@tscircuit/winding-breakout-point-solver"

const input = {
  regions: [
    {
      id: "source",
      bounds: { minX: -6, maxX: -4, minY: -3, maxY: 3 },
      edge: "right",
    },
    {
      id: "target",
      bounds: { minX: 4, maxX: 6, minY: -3, maxY: 3 },
      edge: "left",
    },
  ],
  connections: [
    {
      id: "DQ0",
      endpoints: [
        { regionId: "source", position: { x: -5, y: -0.5 } },
        { regionId: "target", position: { x: 5, y: 0.5 } },
      ],
    },
    {
      type: "differential",
      connections: [
        {
          id: "DQS0",
          endpoints: [
            { regionId: "source", position: { x: -5, y: 0 } },
            { regionId: "target", position: { x: 5, y: 0 } },
          ],
        },
        {
          id: "DQS0_n",
          endpoints: [
            { regionId: "source", position: { x: -5, y: 0.5 } },
            { regionId: "target", position: { x: 5, y: -0.5 } },
          ],
        },
      ],
    },
  ],
  buses: [
    {
      id: "data",
      connectionIds: ["DQ0"],
      preferredLayer: "inner1",
    },
    {
      id: "strobe",
      connectionIds: ["DQS0", "DQS0_n"],
      preferredLayers: ["inner2", "inner3"],
    },
  ],
  boundaryPointSpacing: 0.48,
} satisfies WindingBreakoutSolverInput

const solver = new WindingBreakoutSolver(input)
solver.solve()

if (solver.failed) throw new Error(solver.error ?? "Winding breakout failed")

const output = solver.getOutput()
const graphics = solver.visualize()
```

The solver derives each region center from its bounds, uses the first region's
endpoint geometry as the reference winding, and derives its layer stagger as
`boundaryPointSpacing / 2`. Buses are kept contiguous; fixed buses remain on
`preferredLayer`, while flexible buses are distributed over `preferredLayers`.

`getOutput()` is unavailable until the solver completes successfully. Input
validation runs during solver setup. The `BasePipelineSolver` then runs two
internal solvers: reference ordering and boundary-gate placement. Output
validation runs before the minimal result is exposed. Call `step()` to inspect
the stages incrementally or `solve()` to run to completion.

The package exports the solver, input and output types, error classes, and the
AM62L/LPDDR4 byte-lane, control, and full-link examples.

## Local verification

```sh
bun run format:check
bun run typecheck
bun test --timeout 9999999
bun run build
bun run build:site
git diff --check
```

The React Cosmos debugger renders region bounds, canonical endpoints, and
calculated breakout points. Its layer selector is derived from bus preferences.
Start it with `bun run start`, then open **Region Count Breakdown** for
interactive one-, two-, and three-region examples. Each example exposes the
two pipeline stages independently in the pipeline debugger. The one-region
example also renders caller-owned destination points outside the region, making
the full endpoint-to-breakout-to-destination continuation visible without
turning those destinations into fake regions or breakout points.

## Deployment

The debugger is deployed at
[winding-breakout-point-solver.vercel.app](https://winding-breakout-point-solver.vercel.app).

Vercel deploys `main` to production and creates a preview deployment for each
pull request and non-production branch.
