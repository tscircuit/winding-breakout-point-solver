import { expect, test } from "bun:test"
import { createDdrByte0Example } from "../examples/am62l"
import {
  WindingBreakoutOutputUnavailableError,
  WindingBreakoutSolver,
} from "../lib"

test("getOutput is unavailable until a successful solve", async () => {
  const ddrByte0Example = await createDdrByte0Example()
  const solver = new WindingBreakoutSolver(ddrByte0Example)

  expect(() => solver.getOutput()).toThrow(
    WindingBreakoutOutputUnavailableError,
  )
  expect(solver.solved).toBe(false)
  expect(solver.failed).toBe(false)
})
