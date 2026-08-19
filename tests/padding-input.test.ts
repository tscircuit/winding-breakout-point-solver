import { expect, test } from "bun:test"
import { oneMillimeterPaddingInput } from "../examples/padding/one-millimeter-padding-input"
import { WindingBreakoutSolver } from "../lib"

test("1mm padding input includes every AM62L/LPDDR4 DDR connection", () => {
  expect(
    oneMillimeterPaddingInput.regions.map((region) => region.ports.length),
  ).toEqual([33, 33])

  for (const region of oneMillimeterPaddingInput.regions) {
    expect(
      region.bounds.maxX - region.bounds.minX - region.component.width,
    ).toBeCloseTo(2)
    expect(
      region.bounds.maxY - region.bounds.minY - region.component.height,
    ).toBeCloseTo(2)
  }

  const solver = new WindingBreakoutSolver(oneMillimeterPaddingInput)
  solver.solve()
  expect(solver.solved).toBe(true)
  expect(solver.failed).toBe(false)
  expect(solver.getOutput().breakoutPoints).toHaveLength(66)
})
