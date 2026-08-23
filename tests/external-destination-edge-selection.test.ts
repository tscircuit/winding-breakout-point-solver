import { expect, test } from "bun:test"
import { WindingBreakoutSolver, type WindingBreakoutSolverInput } from "../lib"

const solve = (input: WindingBreakoutSolverInput) => {
  const solver = new WindingBreakoutSolver(input)
  solver.solve()
  return solver
}

test("single-region connections use and align with nearer destination edges", async () => {
  const input: WindingBreakoutSolverInput = {
    regions: [
      {
        id: "controller",
        bounds: { minX: -2, maxX: 2, minY: -2, maxY: 2 },
        edge: "right",
      },
    ],
    connections: [
      {
        id: "RESET",
        endpoints: [
          {
            regionId: "controller",
            position: { x: 1.5, y: -0.5 },
            externalDestination: { x: -4, y: -1 },
          },
        ],
      },
      {
        id: "HEADER_1",
        endpoints: [
          {
            regionId: "controller",
            position: { x: -0.5, y: -1.5 },
            externalDestination: { x: 5, y: -1.5 },
          },
        ],
      },
      {
        id: "HEADER_2",
        endpoints: [
          {
            regionId: "controller",
            position: { x: -0.5, y: 1.5 },
            externalDestination: { x: 5, y: 1.5 },
          },
        ],
      },
    ],
    buses: [],
    boundaryPointSpacing: 0.5,
  }
  const solver = solve(input)
  const output = solver.getOutput()

  expect(
    output.breakoutPoints.find((point) => point.connectionId === "RESET"),
  ).toMatchObject({ x: -2, y: -1, layer: "top" })
  expect(
    output.breakoutPoints
      .filter((point) => point.connectionId.startsWith("HEADER"))
      .map((point) => ({ x: point.x, y: point.y }))
      .sort((first, second) => first.y - second.y),
  ).toEqual([
    { x: 2, y: -0.25 },
    { x: 2, y: 0.25 },
  ])
})

test("bus members retain the declared edge", async () => {
  const input: WindingBreakoutSolverInput = {
    regions: [
      {
        id: "controller",
        bounds: { minX: -2, maxX: 2, minY: -2, maxY: 2 },
        edge: "right",
      },
    ],
    connections: [
      {
        id: "DATA_1",
        endpoints: [
          {
            regionId: "controller",
            position: { x: 0, y: -0.5 },
            externalDestination: { x: -5, y: 1 },
          },
        ],
      },
      {
        id: "DATA_2",
        endpoints: [
          {
            regionId: "controller",
            position: { x: 0, y: 0.5 },
            externalDestination: { x: -5, y: 1 },
          },
        ],
      },
    ],
    buses: [
      {
        id: "data",
        connectionIds: ["DATA_1", "DATA_2"],
        preferredLayer: "top",
      },
    ],
    boundaryPointSpacing: 0.5,
  }
  const solver = solve(input)
  const output = solver.getOutput()

  expect(output.breakoutPoints.every((point) => point.x === 2)).toBe(true)
  expect(output.breakoutPoints.map((point) => point.y).sort()).toEqual([
    -0.25, 0.25,
  ])
})
