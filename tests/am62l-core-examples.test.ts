import { expect, test } from "bun:test"
import {
  createControlBusExample,
  createDdrByte0Example,
  createDdrByte1Example,
  createFullDdrExample,
  getAm62lCircuitJson,
} from "../examples/am62l"
import { detectLinkedBreakoutPointPairs, WindingBreakoutSolver } from "../lib"

test("all AM62L examples are derived from core breakout links", async () => {
  const circuitJson = await getAm62lCircuitJson()
  expect(detectLinkedBreakoutPointPairs(circuitJson)).toHaveLength(33)

  const examples = await Promise.all([
    createDdrByte0Example(),
    createDdrByte1Example(),
    createControlBusExample(),
    createFullDdrExample(),
  ])

  expect(examples.map((example) => example.regions[0]?.ports.length)).toEqual([
    11, 11, 11, 33,
  ])
  expect(
    examples.every(
      (example) =>
        example.initialLayerByConnection === undefined &&
        example.initialLayerByBus === undefined,
    ),
  ).toBe(true)

  for (const example of examples) {
    const solver = new WindingBreakoutSolver(example)
    solver.solve()
    expect(solver.solved).toBe(true)
    expect(solver.failed).toBe(false)
  }
})
