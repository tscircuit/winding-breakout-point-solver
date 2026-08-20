import { expect, test } from "bun:test"
import {
  oneRegionExample,
  oneRegionExternalDestinations,
  threeRegionExample,
  twoRegionExample,
} from "../examples/region-count"
import { WindingBreakoutSolver } from "../lib"
import { getLayerNames } from "../lib/get-layer-names"
import { getCanonicalConnections } from "../lib/input/get-canonical-connections"
import { GatePlacementSolver } from "../lib/solvers/GatePlacementSolver"
import { ReferenceOrderingSolver } from "../lib/solvers/ReferenceOrderingSolver"
import type {
  DifferentialPairInput,
  WindingBreakoutRegion,
  WindingBreakoutSolverInput,
} from "../lib/types"
import { cloneInput, solveSuccessfully } from "./fixtures/solver-test-utils"

const examples = [
  ["one", oneRegionExample],
  ["two", twoRegionExample],
  ["three", threeRegionExample],
] as const

const expectPointOnDeclaredEdge = (
  point: { readonly x: number; readonly y: number },
  region: WindingBreakoutRegion,
): void => {
  if (region.edge === "left") expect(point.x).toBe(region.bounds.minX)
  if (region.edge === "right") expect(point.x).toBe(region.bounds.maxX)
  if (region.edge === "bottom") expect(point.y).toBe(region.bounds.minY)
  if (region.edge === "top") expect(point.y).toBe(region.bounds.maxY)
  expect(point.x).toBeGreaterThanOrEqual(region.bounds.minX)
  expect(point.x).toBeLessThanOrEqual(region.bounds.maxX)
  expect(point.y).toBeGreaterThanOrEqual(region.bounds.minY)
  expect(point.y).toBeLessThanOrEqual(region.bounds.maxY)
}

for (const [label, example] of examples) {
  test(`${label}-region input solves with one valid point per connection and region`, () => {
    const input = cloneInput(example)
    const canonicalConnections = getCanonicalConnections(input)
    const output = solveSuccessfully(input)
    const layerByConnection = new Map(
      canonicalConnections.map((connection) => [
        connection.id,
        connection.layer,
      ]),
    )

    expect(output.validation.valid).toBe(true)
    expect(output.breakoutPoints).toHaveLength(
      canonicalConnections.length * input.regions.length,
    )
    for (const region of input.regions) {
      for (const connection of canonicalConnections) {
        const points = output.breakoutPoints.filter(
          (point) =>
            point.regionId === region.id &&
            point.connectionId === connection.id,
        )
        expect(points).toHaveLength(1)
        expect(points[0]!.layer).toBe(layerByConnection.get(connection.id)!)
        expectPointOnDeclaredEdge(points[0]!, region)
      }
    }

    for (const entry of input.connections) {
      if (!("type" in entry)) continue
      const pair = entry as DifferentialPairInput
      const pairIds = pair.connections.map((connection) => connection.id)
      for (const region of input.regions) {
        const order = output.gateOrderByLayerByRegion[region.id]![pair.layer]!
        expect(
          Math.abs(order.indexOf(pairIds[0]!) - order.indexOf(pairIds[1]!)),
        ).toBe(1)
        const pairPoints = output.breakoutPoints.filter(
          (point) =>
            point.regionId === region.id &&
            pairIds.includes(point.connectionId),
        )
        expect(pairPoints.every((point) => point.layer === pair.layer)).toBe(
          true,
        )
        expect(
          Math.abs(pairPoints[0]!.slotIndex - pairPoints[1]!.slotIndex),
        ).toBe(1)
      }
    }
  })
}

test("one-region solve validates around the normal two-stage pipeline", () => {
  const solver = new WindingBreakoutSolver(cloneInput(oneRegionExample))
  expect(solver.pipelineDef.map((stage) => stage.solverName)).toEqual([
    "referenceOrdering",
    "gatePlacement",
  ])

  solver.setup()
  expect(solver.activeSubSolver).toBeUndefined()
  solver.solve()

  expect(solver.solved).toBe(true)
  expect(Object.keys(solver.getAllOutputs())).toEqual([
    "referenceOrdering",
    "gatePlacement",
  ])
  expect(solver.stats.phase).toBe("finalize-output-validation")
  expect(solver.getOutput().validation.valid).toBe(true)
  const graphics = solver.visualize()
  const phaseLabels = (graphics.texts ?? [])
    .map((text) => text.text)
    .filter((text) => text.startsWith("Step "))
  expect(phaseLabels).toEqual([
    "Step 1 · Derive reference order",
    "Step 2 · Place boundary gates",
  ])
  expect(
    graphics.texts?.some(
      (text) => text.text === "Output · Validated after gate placement",
    ),
  ).toBe(true)
  expect(graphics.lines?.length).toBeGreaterThan(0)
})

test("the first region geometry remains the reference for every region count", () => {
  const outputs = examples.map(([, input]) =>
    solveSuccessfully(cloneInput(input)),
  )
  expect(outputs[1]!.referenceOrder).toEqual(outputs[0]!.referenceOrder)
  expect(outputs[2]!.referenceOrder).toEqual(outputs[0]!.referenceOrder)
  expect(outputs[0]!.referenceOrder).not.toEqual(
    getCanonicalConnections(oneRegionExample).map(
      (connection) => connection.id,
    ),
  )
})

test("reference ordering exposes one geometric region pass and one atomicization pass", () => {
  const input = cloneInput(threeRegionExample)
  const solver = new WindingBreakoutSolver(input)
  solver.setup()

  solver.step()
  const ordering =
    solver.getSolver<ReferenceOrderingSolver>("referenceOrdering")
  expect(ordering).toBeDefined()
  expect(ordering!.iterations).toBe(0)

  solver.step()
  expect(ordering!.solved).toBe(false)
  expect(ordering!.iterations).toBe(1)
  expect(ordering!.stats.phase).toBe("derive-natural-order")
  expect(ordering!.stats.regionId).toBe(input.regions[0]!.id)
  expect(ordering!.progress).toBeGreaterThan(0)
  expect(ordering!.progress).toBeLessThan(1)
  const firstRegionGraphics = ordering!.visualize()
  expect(
    firstRegionGraphics.texts?.some((text) =>
      text.text.includes("regions processed"),
    ),
  ).toBe(true)
  expect(firstRegionGraphics.lines?.length).toBeGreaterThan(0)

  solver.solveUntilStage("gatePlacement")
  expect(ordering!.solved).toBe(true)
  expect(ordering!.iterations).toBe(input.regions.length + 1)
  expect(ordering!.stats.phase).toBe("atomicize-reference-order")
  expect(ordering!.progress).toBe(1)
})

test("gate placement exposes planning, region/layer batches, and finalization", () => {
  const input = cloneInput(threeRegionExample)
  const solver = new WindingBreakoutSolver(input)
  solver.setup()
  solver.solveUntilStage("gatePlacement")

  solver.step()
  const placement = solver.getSolver<GatePlacementSolver>("gatePlacement")
  expect(placement).toBeDefined()
  expect(placement!.iterations).toBe(0)

  solver.step()
  expect(placement!.solved).toBe(false)
  expect(placement!.stats.phase).toBe("plan-gate-grid")
  expect(placement!.stats.placedBreakpoints).toBe(0)
  expect(placement!.progress).toBeGreaterThan(0)
  expect(placement!.progress).toBeLessThan(1)
  const plannedGraphics = placement!.visualize()
  expect(
    plannedGraphics.circles?.some((circle) =>
      circle.label?.startsWith("planned slot"),
    ),
  ).toBe(true)
  expect(plannedGraphics.points ?? []).toHaveLength(0)

  solver.step()
  expect(placement!.stats.phase).toBe("place-region-layer-batch")
  expect(placement!.stats.completedBatches).toBe(1)
  expect(placement!.stats.placedBreakpoints).toBeGreaterThan(0)
  expect(placement!.visualize().points?.length).toBeGreaterThan(0)

  solver.solve()
  expect(placement!.solved).toBe(true)
  expect(placement!.stats.phase).toBe("finalize-shared-gate-slots")
  expect(placement!.iterations).toBe(
    input.regions.length * getLayerNames(input).length + 2,
  )
  expect(placement!.progress).toBe(1)
})

test("one-region visualization destinations remain outside solver regions", () => {
  const region = oneRegionExample.regions[0]!
  expect(oneRegionExternalDestinations).toHaveLength(
    getCanonicalConnections(oneRegionExample).length,
  )
  for (const destination of oneRegionExternalDestinations) {
    const insideRegion =
      destination.position.x >= region.bounds.minX &&
      destination.position.x <= region.bounds.maxX &&
      destination.position.y >= region.bounds.minY &&
      destination.position.y <= region.bounds.maxY
    expect(insideRegion).toBe(false)
  }
})

test("a one-region connection still requires exactly one endpoint", () => {
  const input = cloneInput(oneRegionExample)
  const first = input.connections[0]!
  if ("type" in first) throw new Error("fixture must start with a connection")
  const invalid: WindingBreakoutSolverInput = {
    ...input,
    connections: [{ ...first, endpoints: [] }, ...input.connections.slice(1)],
  }
  const solver = new WindingBreakoutSolver(invalid)
  expect(() => solver.setup()).toThrow(
    'connections[0] is missing endpoint for region "source"',
  )
})
