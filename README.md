# @tscircuit/winding-breakout-point-solver

A typed, deterministic solver for placing winding-aware breakout points on
facing region boundaries. The caller declares every connection once, including
its layer and one endpoint per region. The solver derives winding order and
staggered boundary points; it does not generate traces, dogbones, or vias.

The package is currently private.

## Input API

`connections` is the single source of truth for connection IDs, layers, and
endpoint positions.

```ts
type WindingBreakoutSolverInput = {
  regions: readonly {
    id: string
    bounds: Bounds
    edge: "left" | "right" | "bottom" | "top"
  }[]
  connections: readonly ConnectionOrDifferentialPair[]
  boundaryPointSpacing: number
}

type ConnectionInput = {
  id: string
  layer: string
  endpoints: readonly {
    regionId: string
    position: Point
  }[]
}

type DifferentialPairInput = {
  type: "differential"
  layer: string
  connections: readonly [
    Omit<ConnectionInput, "layer">,
    Omit<ConnectionInput, "layer">,
  ]
}
```

Every connection must have exactly one endpoint for every declared region.
Differential-pair members inherit the pair's layer and remain adjacent in the
breakout order.

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
      layer: "inner1",
      endpoints: [
        { regionId: "source", position: { x: -5, y: -0.5 } },
        { regionId: "target", position: { x: 5, y: 0.5 } },
      ],
    },
    {
      type: "differential",
      layer: "inner2",
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
`boundaryPointSpacing / 2`. It never changes a declared connection layer.

`getOutput()` is unavailable until the solver completes successfully. Call
`step()` to inspect incremental solver state or `solve()` to run to completion.

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
calculated breakout points. Its layer selector is derived from the connection
records.

## Deployment

The debugger is deployed at
[winding-breakout-point-solver.vercel.app](https://winding-breakout-point-solver.vercel.app).

Vercel deploys `main` to production and creates a preview deployment for each
pull request and non-production branch.
