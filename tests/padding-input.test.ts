import { expect, test } from "bun:test"
import { oneMillimeterPaddingInput } from "../examples/padding/one-millimeter-padding-input"
import { WindingBreakoutSolver } from "../lib"
import { getCanonicalConnections } from "../lib/input/get-canonical-connections"

test("1mm padding input includes every AM62L/LPDDR4 DDR connection", () => {
  expect(getCanonicalConnections(oneMillimeterPaddingInput)).toHaveLength(33)
  const [soc, ram] = oneMillimeterPaddingInput.regions
  expect(soc!.bounds.maxX - soc!.bounds.minX).toBeCloseTo(13.25616)
  expect(soc!.bounds.maxY - soc!.bounds.minY).toBeCloseTo(13.25616)
  expect(ram!.bounds.maxX - ram!.bounds.minX).toBeCloseTo(16.05)
  expect(ram!.bounds.maxY - ram!.bounds.minY).toBeCloseTo(11.2)

  const solver = new WindingBreakoutSolver(oneMillimeterPaddingInput)
  solver.solve()
  expect(solver.solved).toBe(true)
  expect(solver.failed).toBe(false)
  expect(solver.getOutput().breakoutPoints).toHaveLength(66)
})
