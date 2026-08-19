import { expect, test } from "bun:test"
import { AM62L_LPDDR4_ONE_MM_CIRCUIT_JSON } from "../examples/padding/am62l-lpddr4-one-mm-circuit-json.generated"
import { createOneMillimeterPaddingExample } from "../examples/padding/one-mm-padding-example"
import { detectLinkedBreakoutPointPairs, WindingBreakoutSolver } from "../lib"

test("1mm padding fixture includes every AM62L/LPDDR4 DDR connection", async () => {
  expect(
    detectLinkedBreakoutPointPairs(AM62L_LPDDR4_ONE_MM_CIRCUIT_JSON),
  ).toHaveLength(33)

  const groups = AM62L_LPDDR4_ONE_MM_CIRCUIT_JSON.filter(
    (element) => element.type === "pcb_group",
  )
  const components = AM62L_LPDDR4_ONE_MM_CIRCUIT_JSON.filter(
    (element) => element.type === "pcb_component",
  )

  for (const group of groups) {
    const component = components.find(
      (candidate) => candidate.pcb_group_id === group.pcb_group_id,
    )
    if (!component || group.width === undefined || group.height === undefined) {
      throw new Error(`Missing geometry for padding group ${group.name}`)
    }
    expect(group.width - component.width).toBeCloseTo(2)
    expect(group.height - component.height).toBeCloseTo(2)
  }

  const example = await createOneMillimeterPaddingExample()
  expect(example.regions.map((region) => region.ports.length)).toEqual([33, 33])

  const solver = new WindingBreakoutSolver(example)
  solver.solve()
  expect(solver.solved).toBe(true)
  expect(solver.failed).toBe(false)
  expect(solver.getOutput().breakoutPoints).toHaveLength(66)
})
