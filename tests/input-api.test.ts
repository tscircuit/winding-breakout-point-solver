import { expect, test } from "bun:test"
import {
  controlBusExample,
  ddrByte0Example,
  ddrByte1Example,
  fullDdrExample,
} from "../examples/am62l"
import { oneRegionExample } from "../examples/region-count"
import {
  type ConnectionInput,
  type DifferentialPairInput,
  WindingBreakoutInputError,
  WindingBreakoutSolver,
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

const expectInputError = async (
  input: WindingBreakoutSolverInput,
  message: string,
): Promise<void> => {
  const solver = new WindingBreakoutSolver(input)
  expect(() => solver.setup()).toThrow(WindingBreakoutInputError)
  expect(() => solver.setup()).toThrow(message)
}

test("zero regions fail validation", async () => {
  await expectInputError(
    {
      ...cloneInput(oneRegionExample),
      regions: [],
    },
    "at least one region is required",
  )
})

test("output returns coordinates and the solver-selected connection layers", async () => {
  const input = cloneInput(ddrByte0Example)
  const output = solveSuccessfully(input)

  expect(Object.keys(output)).toEqual(["breakoutPoints"])
  for (const point of output.breakoutPoints) {
    expect(Object.keys(point).sort()).toEqual([
      "connectionId",
      "layer",
      "regionId",
      "x",
      "y",
    ])
  }
})

test("missing endpoints fail validation", async () => {
  await expectInputError(
    withFirstConnection((connection) => ({
      ...connection,
      endpoints: connection.endpoints.slice(0, 1),
    })),
    'connections[0] is missing endpoint for region "ram"',
  )
})

test("duplicate endpoints fail validation", async () => {
  await expectInputError(
    withFirstConnection((connection) => ({
      ...connection,
      endpoints: [connection.endpoints[0]!, connection.endpoints[0]!],
    })),
    'connections[0] has duplicate endpoint for region "soc"',
  )
})

test("unknown endpoint region ids fail validation", async () => {
  await expectInputError(
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

test("duplicate connection ids fail validation", async () => {
  const input = cloneInput(ddrByte0Example)
  const first = input.connections[0] as ConnectionInput
  const second = input.connections[1] as ConnectionInput
  await expectInputError(
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

test("points outside region bounds fail validation", async () => {
  await expectInputError(
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

test("non-finite external destinations fail validation", async () => {
  await expectInputError(
    withFirstConnection((connection) => ({
      ...connection,
      endpoints: connection.endpoints.map((endpoint, index) =>
        index === 0
          ? {
              ...endpoint,
              externalDestination: { x: Number.NaN, y: 0 },
            }
          : endpoint,
      ),
    })),
    "connections[0].endpoints[0].externalDestination.x must be finite",
  )
})

test("invalid differential pairs fail validation", async () => {
  const input = cloneInput(ddrByte0Example)
  const pairIndex = input.connections.findIndex(
    (connection) => "type" in connection && connection.type === "differential",
  )
  const pair = input.connections[pairIndex] as DifferentialPairInput
  const invalidPair = {
    ...pair,
    connections: [pair.connections[0]],
  } as unknown as DifferentialPairInput
  await expectInputError(
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

test("differential pairs remain atomic on their selected layer", async () => {
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
  const pairLayer = pairPoints.find(
    (point) => point.connectionId === pairIds[0],
  )!.layer
  expect(new Set(pairPoints.map((point) => point.layer))).toEqual(
    new Set([pairLayer]),
  )
  for (const region of input.regions) {
    const vertical = region.edge === "left" || region.edge === "right"
    const order = output.breakoutPoints
      .filter(
        (point) => point.regionId === region.id && point.layer === pairLayer,
      )
      .sort((first, second) => {
        if (vertical) return first.y - second.y
        return first.x - second.x
      })
      .map((point) => point.connectionId)
    expect(
      Math.abs(order.indexOf(pairIds[0]!) - order.indexOf(pairIds[1]!)),
    ).toBe(1)
  }
})

test("all AM62L and LPDDR4 examples solve successfully", async () => {
  for (const input of [
    ddrByte0Example,
    ddrByte1Example,
    controlBusExample,
    fullDdrExample,
  ]) {
    const output = solveSuccessfully(cloneInput(input))
    expect(output.breakoutPoints).toHaveLength(
      getCanonicalConnections(input).length * input.regions.length,
    )
  }
})

test("preferredLayers remain available for solver distribution", async () => {
  const input = cloneInput(ddrByte0Example)
  const output = solveSuccessfully(input)
  expect(new Set(output.breakoutPoints.map((point) => point.layer))).toEqual(
    new Set(["inner1", "inner4"]),
  )
})

test("preferredLayer is a permanent assignment even when alternatives exist", async () => {
  const input = cloneInput(ddrByte0Example)
  const fixedLayerInput = {
    ...input,
    buses: [
      {
        ...input.buses[0]!,
        preferredLayer: "inner3",
        preferredLayers: ["inner1", "inner4"],
      },
    ],
  }
  const output = solveSuccessfully(fixedLayerInput)
  expect(new Set(output.breakoutPoints.map((point) => point.layer))).toEqual(
    new Set(["inner3"]),
  )
})
