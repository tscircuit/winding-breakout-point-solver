import type { CircuitJson } from "circuit-json"
import { createWindingBreakoutInputFromCircuitJson } from "../../lib"
import type { WindingBreakoutExample } from "../../lib/types"

const connectionNames = ["D0", "D1", "CLK", "CLK_n"] as const

/**
 * Compact Circuit JSON equivalent to two core-rendered breakout groups.
 *
 * LEFT_BREAKOUT wraps a 1.5 × 4 mm component with:
 *   top=2, right=3, bottom=1, left=0.5 mm
 * RIGHT_BREAKOUT mirrors that padding toward the routing channel.
 */
const ASYMMETRIC_PADDING_CIRCUIT_JSON = [
  {
    type: "pcb_board",
    pcb_board_id: "pcb_board_padding",
    center: { x: 0, y: 0 },
    width: 24,
    height: 12,
    thickness: 1.6,
    num_layers: 4,
    material: "fr4",
    min_trace_width: 0.05,
    min_trace_to_pad_edge_clearance: 0.05,
    min_via_pad_diameter: 0.24,
  },
  {
    type: "pcb_group",
    pcb_group_id: "pcb_group_left",
    source_group_id: "source_group_left",
    name: "LEFT_BREAKOUT",
    center: { x: -5.75, y: 0.5 },
    width: 5,
    height: 7,
    anchor_alignment: "center",
    pcb_component_ids: ["pcb_component_left"],
  },
  {
    type: "pcb_group",
    pcb_group_id: "pcb_group_right",
    source_group_id: "source_group_right",
    name: "RIGHT_BREAKOUT",
    center: { x: 5.75, y: -0.5 },
    width: 5,
    height: 7,
    anchor_alignment: "center",
    pcb_component_ids: ["pcb_component_right"],
  },
  {
    type: "pcb_component",
    pcb_component_id: "pcb_component_left",
    source_component_id: "source_component_left",
    pcb_group_id: "pcb_group_left",
    center: { x: -7, y: 0 },
    width: 1.5,
    height: 4,
    layer: "top",
    rotation: 0,
    obstructs_within_bounds: true,
  },
  {
    type: "pcb_component",
    pcb_component_id: "pcb_component_right",
    source_component_id: "source_component_right",
    pcb_group_id: "pcb_group_right",
    center: { x: 7, y: 0 },
    width: 1.5,
    height: 4,
    layer: "top",
    rotation: 0,
    obstructs_within_bounds: true,
  },
  ...connectionNames.flatMap((name, index) => {
    const sourceTraceId = `source_trace_padding_${index}`
    const leftSourcePortId = `source_port_left_${index}`
    const rightSourcePortId = `source_port_right_${index}`
    const y = -1.5 + index

    return [
      {
        type: "source_trace" as const,
        source_trace_id: sourceTraceId,
        name,
        connected_source_port_ids: [leftSourcePortId, rightSourcePortId],
        connected_source_net_ids: [],
      },
      {
        type: "pcb_port" as const,
        pcb_port_id: `pcb_port_left_${index}`,
        pcb_component_id: "pcb_component_left",
        pcb_group_id: "pcb_group_left",
        source_port_id: leftSourcePortId,
        x: -6.75,
        y,
        layers: ["top" as const],
      },
      {
        type: "pcb_port" as const,
        pcb_port_id: `pcb_port_right_${index}`,
        pcb_component_id: "pcb_component_right",
        pcb_group_id: "pcb_group_right",
        source_port_id: rightSourcePortId,
        x: 6.75,
        y,
        layers: ["top" as const],
      },
      {
        type: "pcb_breakout_point" as const,
        pcb_breakout_point_id: `pcb_breakout_point_left_${index}`,
        pcb_group_id: "pcb_group_left",
        source_trace_id: sourceTraceId,
        source_port_id: leftSourcePortId,
        x: -3.25,
        y,
      },
      {
        type: "pcb_breakout_point" as const,
        pcb_breakout_point_id: `pcb_breakout_point_right_${index}`,
        pcb_group_id: "pcb_group_right",
        source_trace_id: sourceTraceId,
        source_port_id: rightSourcePortId,
        x: 3.25,
        y,
      },
    ]
  }),
] as CircuitJson

export const createAsymmetricPaddingExample =
  async (): Promise<WindingBreakoutExample> => ({
    ...createWindingBreakoutInputFromCircuitJson({
      circuitJson: ASYMMETRIC_PADDING_CIRCUIT_JSON,
    }),
    sample: {
      id: "asymmetric-padding",
      label: "Asymmetric Padding",
      shortLabel: "Padding",
      description: "Mirrored asymmetric breakout padding around two components",
      sourceFile: "examples/padding/asymmetric-padding-example.ts",
    },
  })
