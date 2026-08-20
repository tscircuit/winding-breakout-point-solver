import { expect, test } from "bun:test"
import {
  controlBusExample,
  ddrByte0Example,
  ddrByte1Example,
  fullDdrExample,
} from "../examples/am62l"
import {
  WindingBreakoutInputError,
  WindingBreakoutSolver,
  type ConnectionInput,
  type DifferentialPairInput,
  type WindingBreakoutSolverInput,
} from "../lib"
import { getCanonicalConnections } from "../lib/input/get-canonical-connections"
import { cloneInput, solveSuccessfully } from "./fixtures/solver-test-utils"

const withFirstConnection = (
  update: (connection: ConnectionInput) => ConnectionInput,
): WindingBreakoutSolverInput => {
  const input = cloneInput(ddrByte0Example)
  const first = input.connections[0] as ConnectionInput
  return {
    ...input,
    connections: [update(first), ...input.connections.slice(1)],
  }
}

const expectInputError = (
  input: WindingBreakoutSolverInput,
  message: string,
): void => {
  const solver = new WindingBreakoutSolver(input)
  expect(() => solver.setup()).toThrow(WindingBreakoutInputError)
  expect(() => solver.setup()).toThrow(message)
}

test("layers are never reassigned", () => {
  const input = cloneInput(ddrByte0Example)
  const output = solveSuccessfully(input)
  const expectedLayers = new Map(
    getCanonicalConnections(input).map((connection) => [
      connection.id,
      connection.layer,
    ]),
  )

  for (const point of output.breakoutPoints) {
    expect(point.layer).toBe(expectedLayers.get(point.connectionId)!)
  }
})

test("missing endpoints fail validation", () => {
  expectInputError(
    withFirstConnection((connection) => ({
      ...connection,
      endpoints: connection.endpoints.slice(0, 1),
    })),
    'connections[0] is missing endpoint for region "ram"',
  )
})

test("duplicate endpoints fail validation", () => {
  expectInputError(
    withFirstConnection((connection) => ({
      ...connection,
      endpoints: [connection.endpoints[0]!, connection.endpoints[0]!],
    })),
    'connections[0] has duplicate endpoint for region "soc"',
  )
})

test("unknown endpoint region ids fail validation", () => {
  expectInputError(
    withFirstConnection((connection) => ({
      ...connection,
      endpoints: [
        { ...connection.endpoints[0]!, regionId: "unknown" },
        connection.endpoints[1]!,
      ],
    })),
    'connections[0].endpoints[0] references unknown region "unknown"',
  )
})

test("duplicate connection ids fail validation", () => {
  const input = cloneInput(ddrByte0Example)
  const first = input.connections[0] as ConnectionInput
  const second = input.connections[1] as ConnectionInput
  expectInputError(
    {
      ...input,
      connections: [
        first,
        { ...second, id: first.id },
        ...input.connections.slice(2),
      ],
    },
    `duplicate connection id "${first.id}"`,
  )
})

test("points outside region bounds fail validation", () => {
  expectInputError(
    withFirstConnection((connection) => ({
      ...connection,
      endpoints: [
        { ...connection.endpoints[0]!, position: { x: 1000, y: 1000 } },
        connection.endpoints[1]!,
      ],
    })),
    'connections[0] endpoint for region "soc" is outside its bounds',
  )
})

test("invalid differential pairs fail validation", () => {
  const input = cloneInput(ddrByte0Example)
  const pairIndex = input.connections.findIndex(
    (connection) => "type" in connection && connection.type === "differential",
  )
  const pair = input.connections[pairIndex] as DifferentialPairInput
  const invalidPair = {
    ...pair,
    connections: [pair.connections[0]],
  } as unknown as DifferentialPairInput
  expectInputError(
    {
      ...input,
      connections: input.connections.map((connection, index) => {
        if (index === pairIndex) return invalidPair
        return connection
      }),
    },
    `connections[${pairIndex}].connections must contain exactly two members`,
  )
})

test("differential pairs remain atomic on their declared layer", () => {
  const input = cloneInput(ddrByte0Example)
  const pair = input.connections.find(
    (connection): connection is DifferentialPairInput =>
      "type" in connection && connection.type === "differential",
  )!
  const output = solveSuccessfully(input)
  const pairIds = pair.connections.map((connection) => connection.id)
  const pairPoints = output.breakoutPoints.filter((point) =>
    pairIds.includes(point.connectionId),
  )

  expect(pairPoints.every((point) => point.layer === pair.layer)).toBe(true)
  for (const region of input.regions) {
    const order = output.gateOrderByLayerByRegion[region.id]![pair.layer]!
    expect(
      Math.abs(order.indexOf(pairIds[0]!) - order.indexOf(pairIds[1]!)),
    ).toBe(1)
  }
})

test("all AM62L and LPDDR4 examples solve successfully", () => {
  for (const input of [
    ddrByte0Example,
    ddrByte1Example,
    controlBusExample,
    fullDdrExample,
  ]) {
    const output = solveSuccessfully(cloneInput(input))
    expect(output.solved).toBe(true)
    expect(output.breakoutPoints).toHaveLength(
      getCanonicalConnections(input).length * input.regions.length,
    )
  }
})
