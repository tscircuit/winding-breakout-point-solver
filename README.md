# @tscircuit/winding-breakout-point-solver

A typed, deterministic tscircuit solver for calculating winding-aware breakout
points on facing component-region boundaries. It preserves connection order,
assigns each connection to a layer, keeps differential pairs atomic, and places
staggered boundary points. It does not generate traces, dogbones, or vias.

The package is currently private and has no publishing, deployment, or runtime
network integration.

## Usage

The canonical example below is the same typed byte-0 input used by the tests and
the React Cosmos debugger.

```ts
import {
  ddrByte0Example,
  WindingBreakoutSolver,
} from "@tscircuit/winding-breakout-point-solver"

const solver = new WindingBreakoutSolver(ddrByte0Example)
solver.solve()

if (solver.failed) {
  throw new Error(solver.error ?? "Winding breakout failed")
}

const output = solver.getOutput()
const graphics = solver.visualize()
```

`getOutput()` is intentionally unavailable until a successful terminal state.
When `allowDiagnosticBestEffort` is enabled, an infeasible placement remains
failed and unsolved; its marked points are available only from
`getDiagnosticOutput()` and `visualize()`.

## Solver lifecycle

`WindingBreakoutSolver` extends `BaseSolver` and advances through meaningful
validation, ordering, layer assignment, breakpoint placement, per-bus
validation, and combination steps. Call `step()`
to inspect incremental progress or `solve()` to run to a terminal state.

The public package exports the solver, its specific error classes, all input,
output, geometry, validation, and example types, and the byte-0, byte-1, and
full-link AM62L/LPDDR4 examples.

## Local verification

```sh
bun run format:check
bun run typecheck
bun test --timeout 9999999
bun run build
bun run build:site
git diff --check
git remote -v
```

The Cosmos page runs the exported solver directly with the canonical byte-0
example and renders its `GraphicsObject`; its compact selector filters the
displayed breakout points by signal layer.

## Deployment

The React Cosmos debugger is deployed at
[winding-breakout-point-solver.vercel.app](https://winding-breakout-point-solver.vercel.app).

Vercel deploys `main` to production and creates a preview deployment for each
pull request and non-production branch.
