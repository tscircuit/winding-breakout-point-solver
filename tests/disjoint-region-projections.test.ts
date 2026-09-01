import { expect, test } from "bun:test"
import { WindingBreakoutSolver, type WindingBreakoutSolverInput } from "../lib"

const diagonalRegionsInput = {
  regions: [
    {
      id: "source",
      bounds: { minX: -2, maxX: 0, minY: -1, maxY: 1 },
      edge: "right",
    },
    {
      id: "target",
      bounds: { minX: 4, maxX: 6, minY: 3, maxY: 5 },
      edge: "left",
    },
  ],
  connections: [
    {
      id: "DQ0",
      endpoints: [
        { regionId: "source", position: { x: -1, y: -0.5 } },
        { regionId: "target", position: { x: 5, y: 3.5 } },
      ],
    },
    {
      id: "DQ1",
      endpoints: [
        { regionId: "source", position: { x: -1, y: 0 } },
        { regionId: "target", position: { x: 5, y: 4 } },
      ],
    },
    {
      id: "DQ2",
      endpoints: [
        { regionId: "source", position: { x: -1, y: 0.5 } },
        { regionId: "target", position: { x: 5, y: 4.5 } },
      ],
    },
  ],
  buses: [
    {
      id: "data",
      connectionIds: ["DQ0", "DQ1", "DQ2"],
      preferredLayer: "inner1",
    },
  ],
  boundaryPointSpacing: 0.4,
} satisfies WindingBreakoutSolverInput

test("parallel breakout edges with disjoint projections use regional gate grids", () => {
  const solver = new WindingBreakoutSolver(diagonalRegionsInput)
  solver.solve()

  expect(solver.failed).toBe(false)
  expect(solver.solved).toBe(true)

  const points = solver.getOutput().breakoutPoints
  expect(points).toHaveLength(6)

  const sourcePoints = points.filter((point) => point.regionId === "source")
  const targetPoints = points.filter((point) => point.regionId === "target")
  expect(sourcePoints.map((point) => point.connectionId)).toEqual(
    targetPoints.map((point) => point.connectionId),
  )
  expect(sourcePoints.every((point) => point.x === 0)).toBe(true)
  expect(targetPoints.every((point) => point.x === 4)).toBe(true)
  expect(sourcePoints.every((point) => point.y >= -1 && point.y <= 1)).toBe(
    true,
  )
  expect(targetPoints.every((point) => point.y >= 3 && point.y <= 5)).toBe(true)
})
