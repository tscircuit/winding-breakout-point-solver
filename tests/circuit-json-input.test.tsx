import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import {
  createWindingBreakoutInputFromCircuitJson,
  detectLinkedBreakoutPointPairs,
  WindingBreakoutSolver,
} from "../lib"

const connectionNames = ["D0", "D1", "CLK", "CLK_n"] as const

/** The subset of Circuit JSON emitted by core after its breakout solver runs. */
const getLinkedBreakoutCircuitJson = (): CircuitJson => {
  const socPositions = [
    [-7, -1.5],
    [-6.5, -0.5],
    [-7, 0.5],
    [-6.5, 1.5],
  ] as const
  const ramPositions = [
    [6.5, -1.5],
    [7, -0.5],
    [6.5, 0.5],
    [7, 1.5],
  ] as const

  return [
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      width: 30,
      height: 16,
      thickness: 1.6,
      num_layers: 4,
      material: "fr4",
      min_trace_width: 0.05,
      min_trace_to_pad_edge_clearance: 0.05,
      min_via_pad_diameter: 0.24,
    },
    {
      type: "pcb_group",
      pcb_group_id: "pcb_group_soc",
      source_group_id: "source_group_soc",
      name: "SOC_BREAKOUT",
      center: { x: -7, y: 0 },
      width: 3,
      height: 6,
      anchor_alignment: "center",
      pcb_component_ids: ["pcb_component_soc"],
    },
    {
      type: "pcb_group",
      pcb_group_id: "pcb_group_ram",
      source_group_id: "source_group_ram",
      name: "RAM_BREAKOUT",
      center: { x: 7, y: 0 },
      width: 3,
      height: 6,
      anchor_alignment: "center",
      pcb_component_ids: ["pcb_component_ram"],
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_soc",
      source_component_id: "source_component_soc",
      pcb_group_id: "pcb_group_soc",
      center: { x: -7, y: 0 },
      width: 1.5,
      height: 4,
      layer: "top",
      rotation: 0,
      obstructs_within_bounds: true,
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_ram",
      source_component_id: "source_component_ram",
      pcb_group_id: "pcb_group_ram",
      center: { x: 7, y: 0 },
      width: 1.5,
      height: 4,
      layer: "top",
      rotation: 0,
      obstructs_within_bounds: true,
    },
    ...connectionNames.flatMap((name, index) => {
      const sourceTraceId = `source_trace_${index}`
      const socSourcePortId = `source_port_soc_${index}`
      const ramSourcePortId = `source_port_ram_${index}`
      const socPosition = socPositions[index]!
      const ramPosition = ramPositions[index]!
      return [
        {
          type: "source_trace" as const,
          source_trace_id: sourceTraceId,
          name,
          connected_source_port_ids: [socSourcePortId, ramSourcePortId],
          connected_source_net_ids: [],
        },
        {
          type: "pcb_port" as const,
          pcb_port_id: `pcb_port_soc_${index}`,
          pcb_group_id: "pcb_group_soc",
          source_port_id: socSourcePortId,
          x: socPosition[0],
          y: socPosition[1],
          layers: ["top" as const],
        },
        {
          type: "pcb_port" as const,
          pcb_port_id: `pcb_port_ram_${index}`,
          pcb_group_id: "pcb_group_ram",
          source_port_id: ramSourcePortId,
          x: ramPosition[0],
          y: ramPosition[1],
          layers: ["top" as const],
        },
        {
          type: "pcb_breakout_point" as const,
          pcb_breakout_point_id: `pcb_breakout_point_soc_${index}`,
          pcb_group_id: "pcb_group_soc",
          source_trace_id: sourceTraceId,
          source_port_id: socSourcePortId,
          x: -5.5,
          y: socPosition[1],
        },
        {
          type: "pcb_breakout_point" as const,
          pcb_breakout_point_id: `pcb_breakout_point_ram_${index}`,
          pcb_group_id: "pcb_group_ram",
          source_trace_id: sourceTraceId,
          source_port_id: ramSourcePortId,
          x: 5.5,
          y: ramPosition[1],
        },
      ]
    }),
  ] as CircuitJson
}

test("detects linked breakout pairs from core Circuit JSON", () => {
  const circuitJson = getLinkedBreakoutCircuitJson()
  const pairs = detectLinkedBreakoutPointPairs(circuitJson)

  expect(pairs.map((pair) => pair.connectionId)).toEqual([
    "CLK",
    "CLK_n",
    "D0",
    "D1",
  ])
  expect(pairs.every((pair) => pair.points.length === 2)).toBe(true)
  expect(
    pairs.every(
      (pair) => pair.points[0].pcbGroupId !== pair.points[1].pcbGroupId,
    ),
  ).toBe(true)
  expect(
    pairs.every((pair) =>
      pair.points.every((point) => point.portLayers.includes("top")),
    ),
  ).toBe(true)
})

test("builds and solves winding input directly from a core circuit", () => {
  const circuitJson = getLinkedBreakoutCircuitJson()
  const input = createWindingBreakoutInputFromCircuitJson({
    circuitJson,
    breakoutGroupNames: ["SOC_BREAKOUT", "RAM_BREAKOUT"],
  })

  expect(input.regions).toHaveLength(2)
  expect(input.regions.map((region) => region.label)).toEqual([
    "SOC_BREAKOUT",
    "RAM_BREAKOUT",
  ])
  expect(input.regions.map((region) => region.edge)).toEqual(["right", "left"])
  expect(input.regions[0]!.ports.map((port) => port.connectionId)).toEqual([
    "CLK",
    "CLK_n",
    "D0",
    "D1",
  ])
  expect(input.padLayer).toBe("top")
  expect(input.layerNames).toEqual(["inner1", "inner2", "bottom"])
  expect(input.boundaryPointSpacing).toBeCloseTo(0.44)
  expect(input.differentialPairs).toEqual([
    { positive: "CLK", negative: "CLK_n" },
  ])
  expect(input.busLocalOptimization).toBe(false)

  const solver = WindingBreakoutSolver.fromCircuitJson({
    circuitJson,
    breakoutGroupNames: ["SOC_BREAKOUT", "RAM_BREAKOUT"],
  })
  solver.solve()

  expect(solver.solved).toBe(true)
  expect(solver.getOutput().breakoutPoints).toHaveLength(8)
})

test("filters automatically linked pairs by trace name", () => {
  const circuitJson = getLinkedBreakoutCircuitJson()
  const input = createWindingBreakoutInputFromCircuitJson({
    circuitJson,
    connectionIds: ["CLK", "CLK_n"],
  })

  expect(input.regions[0]!.ports.map((port) => port.connectionId)).toEqual([
    "CLK",
    "CLK_n",
  ])
  expect(input.differentialPairs).toEqual([
    { positive: "CLK", negative: "CLK_n" },
  ])
})
