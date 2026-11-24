import { expect, test } from "bun:test"
import { WindingBreakoutSolver, type WindingBreakoutSolverInput } from "../lib"

test("capacity accounts for which layer carries the longest gate row", () => {
  const connections = ["A0", "A1", "A2", "Z0"].map((id, index) => ({
    id,
    endpoints: [
      {
        regionId: "breakout",
        position: { x: 0.5, y: 0.4 + index * 0.3 },
      },
    ],
  }))
  const input: WindingBreakoutSolverInput = {
    regions: [
      {
        id: "breakout",
        bounds: { minX: 0, maxX: 1, minY: 0, maxY: 2 },
        edge: "right",
      },
    ],
    connections,
    buses: [
      {
        id: "busy",
        connectionIds: ["A0", "A1", "A2"],
        preferredLayer: "a",
      },
      { id: "sparse", connectionIds: ["Z0"], preferredLayer: "z" },
    ],
    boundaryPointSpacing: 1,
  }

  const solver = new WindingBreakoutSolver(input)
  solver.solve()

  expect(solver.failed).toBe(false)
  const yByConnection = Object.fromEntries(
    solver
      .getOutput()
      .breakoutPoints.map((point) => [point.connectionId, point.y]),
  )
  expect(yByConnection).toEqual({
    A0: 0,
    A1: 1,
    A2: 2,
    Z0: 0.5,
  })
})
