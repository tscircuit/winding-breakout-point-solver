import { expect, test } from "bun:test"
import { createDdrByte0Example } from "../examples/am62l"
import {
  cloneInput,
  deepFreeze,
  solveSuccessfully,
} from "./fixtures/solver-test-utils"

test("solving leaves a deeply frozen caller input unchanged", async () => {
  const ddrByte0Example = await createDdrByte0Example()
  const input = deepFreeze(cloneInput(ddrByte0Example))
  const before = JSON.stringify(input)

  solveSuccessfully(input)

  expect(JSON.stringify(input)).toBe(before)
  expect(Object.isFrozen(input)).toBe(true)
  expect(input.regions.every((region) => Object.isFrozen(region.ports))).toBe(
    true,
  )
})
