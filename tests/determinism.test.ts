import { expect, test } from "bun:test"
import { ddrByte0Example } from "../examples/am62l"
import type { WindingBreakoutSolverInput } from "../lib"
import { cloneInput, solveSuccessfully } from "./fixtures/solver-test-utils"

const reverseObjectProperties = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(reverseObjectProperties)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value)
      .reverse()
      .map(([key, child]) => [key, reverseObjectProperties(child)]),
  )
}

test("reordering object properties does not affect output", () => {
  const first = solveSuccessfully(cloneInput(ddrByte0Example))
  const reordered = reverseObjectProperties(
    cloneInput(ddrByte0Example),
  ) as WindingBreakoutSolverInput
  const second = solveSuccessfully(reordered)

  expect(JSON.stringify(second)).toBe(JSON.stringify(first))
})
