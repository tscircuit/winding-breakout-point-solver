import { expect, test } from "bun:test"
import { ddrByte0Example } from "../examples/am62l"
import { threeRegionExample } from "../examples/region-count"
import type {
  ConnectionOrDifferentialPair,
  DifferentialPairInput,
  WindingBreakoutSolverInput,
} from "../lib"
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

const reverseCanonicalConnections = (
  connections: readonly ConnectionOrDifferentialPair[],
): ConnectionOrDifferentialPair[] =>
  [...connections].reverse().map((connection) => {
    if (!("type" in connection)) return connection
    return {
      ...connection,
      connections: [
        connection.connections[1],
        connection.connections[0],
      ] as DifferentialPairInput["connections"],
    }
  })

test("reordering canonical connections does not change output", () => {
  const input = cloneInput(threeRegionExample)
  const first = solveSuccessfully(input)
  const reordered = solveSuccessfully({
    ...input,
    connections: reverseCanonicalConnections(input.connections),
  })

  expect(JSON.stringify(reordered)).toBe(JSON.stringify(first))
})

const reverseConnectionEndpoints = (
  connections: readonly ConnectionOrDifferentialPair[],
): ConnectionOrDifferentialPair[] =>
  connections.map((connection) => {
    if (!("type" in connection)) {
      return { ...connection, endpoints: [...connection.endpoints].reverse() }
    }
    return {
      ...connection,
      connections: [
        {
          ...connection.connections[0],
          endpoints: [...connection.connections[0].endpoints].reverse(),
        },
        {
          ...connection.connections[1],
          endpoints: [...connection.connections[1].endpoints].reverse(),
        },
      ],
    }
  })

test("endpoint region ids make endpoint array order irrelevant", () => {
  const input = cloneInput(threeRegionExample)
  const first = solveSuccessfully(input)
  const reordered = solveSuccessfully({
    ...input,
    connections: reverseConnectionEndpoints(input.connections),
  })

  expect(JSON.stringify(reordered)).toBe(JSON.stringify(first))
})
