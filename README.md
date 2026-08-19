# @tscircuit/winding-breakout-point-solver

A typed, deterministic tscircuit solver for calculating winding-aware breakout
points on facing component-region boundaries. It preserves connection order,
assigns each connection to a layer, keeps differential pairs atomic, and places
staggered boundary points. It does not generate traces, dogbones, or vias.

The package is currently private and has no publishing, deployment, or runtime
network integration.

## Core Circuit JSON input (recommended)

Use ordinary tscircuit components to describe the board. Core's existing
breakout solver creates the first-pass `pcb_breakout_point` records; the
winding adapter matches records from different breakout groups when they have
the same `source_trace_id`.

```tsx
import { Circuit } from "@tscircuit/core"
import { WindingBreakoutSolver } from "@tscircuit/winding-breakout-point-solver"

const circuit = new Circuit()
circuit.add(
  <board width="40mm" height="20mm" layers={8} routingDisabled>
    <breakout name="SOC_BREAKOUT" pcbX={-10} padding="1mm">
      <chip name="U1" footprint="soic8" />
    </breakout>
    <breakout name="RAM_BREAKOUT" pcbX={10} padding="1mm">
      <chip name="U2" footprint="soic8" />
    </breakout>
    <trace name="DQ0" from="U1.pin1" to="U2.pin1" />
    <trace name="DQS0" from="U1.pin2" to="U2.pin2" />
    <trace name="DQS0_n" from="U1.pin3" to="U2.pin3" />
  </board>,
)

await circuit.renderUntilSettled()

const solver = WindingBreakoutSolver.fromCircuitJson({
  circuitJson: circuit.getCircuitJson(),
  breakoutGroupNames: ["SOC_BREAKOUT", "RAM_BREAKOUT"],
})
solver.solve()
const output = solver.getOutput()
```

The adapter derives group bounds, source-pad positions, facing edges, pad
layer, routing layers, and breakout spacing from Circuit JSON. A named source
trace becomes the public connection id; unnamed traces use their
`source_trace_id`. `NAME`/`NAME_n` traces are recognized as differential pairs.

When the circuit contains only one linked pair of breakout groups,
`breakoutGroupNames` can be omitted. Use `connectionIds` to select a subset of
the automatically linked traces. Explicit stackups, bus bands, layer hints,
and other advanced controls remain available through `stackup`, `layerNames`,
and `solverOverrides`.

`detectLinkedBreakoutPointPairs(circuitJson)` exposes the detected links for
debugging. A link is intentionally point-to-point: exactly two breakout points
must share a source trace and belong to different PCB groups.

## Core-rendered AM62L examples

The four AM62L examples are async factories because they render one shared core
circuit before selecting a byte lane, the control bus, or all 33 connections.
The example below is the same byte-0 input used by the tests and React Cosmos
debugger.

```ts
import {
  createDdrByte0Example,
} from "@tscircuit/winding-breakout-point-solver/examples/am62l"
import { WindingBreakoutSolver } from "@tscircuit/winding-breakout-point-solver"

const ddrByte0Example = await createDdrByte0Example()
const solver = new WindingBreakoutSolver(ddrByte0Example)
solver.solve()

if (solver.failed) {
  throw new Error(solver.error ?? "Winding breakout failed")
}

const output = solver.getOutput()
const graphics = solver.visualize()
```

The low-level `new WindingBreakoutSolver(input)` constructor remains available
for already-normalized inputs. New tscircuit integrations should prefer
`fromCircuitJson` so component geometry and paired endpoints are not duplicated
in application code.

`getOutput()` is intentionally unavailable until a successful terminal state.
When `allowDiagnosticBestEffort` is enabled, an infeasible placement remains
failed and unsolved; its marked points are available only from
`getDiagnosticOutput()` and `visualize()`.

## Solver lifecycle

`WindingBreakoutSolver` extends `BaseSolver` and advances through meaningful
validation, ordering, layer assignment, breakpoint placement, per-bus
validation, and combination steps. Call `step()`
to inspect incremental progress or `solve()` to run to a terminal state.

The main package exports the solver, its specific error classes, and all input,
output, geometry, validation, and example types. The core-rendered AM62L/LPDDR4
example factories are available from the `/examples/am62l` subpath, keeping
core and the example component libraries out of the low-level solver entrypoint.

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

The Cosmos page renders the canonical tscircuit core design once, derives each
of its four solver inputs from Circuit JSON, and renders the selected solver's
`GraphicsObject`. Its compact selector filters the displayed breakout points by
signal layer.

## Deployment

The React Cosmos debugger is deployed at
[winding-breakout-point-solver.vercel.app](https://winding-breakout-point-solver.vercel.app).

Vercel deploys `main` to production and creates a preview deployment for each
pull request and non-production branch.
