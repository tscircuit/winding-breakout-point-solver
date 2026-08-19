import { expect, test } from "bun:test"
import { ddrByte0Example } from "../examples/am62l"
import { cloneInput, solveSuccessfully } from "./fixtures/solver-test-utils"

test("repeated cloned inputs produce byte-identical output", () => {
  const first = solveSuccessfully(cloneInput(ddrByte0Example))
  const second = solveSuccessfully(cloneInput(ddrByte0Example))
  const reconstructed = solveSuccessfully({
    ...cloneInput(ddrByte0Example),
    busByConnection: Object.fromEntries(
      Object.entries(ddrByte0Example.busByConnection ?? {}).reverse(),
    ),
    initialLayerByConnection: Object.fromEntries(
      Object.entries(ddrByte0Example.initialLayerByConnection ?? {}).reverse(),
    ),
  })

  expect(JSON.stringify(second)).toBe(JSON.stringify(first))
  expect(JSON.stringify(reconstructed)).toBe(JSON.stringify(first))
})
