import type {
  AnyCircuitElement,
  PcbBoard,
  PcbBreakoutPoint as CircuitJsonBreakoutPoint,
  PcbComponent,
  PcbGroup,
  PcbPort,
  SourceTrace,
} from "circuit-json"
import type {
  BreakoutEdge,
  DifferentialPairInput,
  Point,
  StackupEntry,
  WindingBreakoutRegion,
  WindingBreakoutSolverInput,
} from "../types"
import { WindingBreakoutInputError } from "./errors"

type DerivedInputKey =
  | "regions"
  | "padLayer"
  | "layerNames"
  | "stackup"
  | "boundaryPointSpacing"
  | "breakoutStaggerOffset"

/** Advanced solver settings that cannot be inferred from Circuit JSON. */
export type WindingBreakoutSolverOverrides = Omit<
  Partial<WindingBreakoutSolverInput>,
  DerivedInputKey
>

export interface WindingBreakoutCircuitJsonInput {
  /** Circuit JSON emitted after tscircuit core has rendered its breakouts. */
  readonly circuitJson: readonly AnyCircuitElement[]
  /** Select two breakout groups by their core-generated ids. */
  readonly breakoutGroupIds?: readonly [string, string]
  /** Select two breakout groups by their tscircuit `name` props. */
  readonly breakoutGroupNames?: readonly [string, string]
  /**
   * Optional connection-name/source-trace-id filter. By default, every
   * point-to-point trace shared by the selected breakouts is included.
   */
  readonly connectionIds?: readonly string[]
  /** Defaults to the common copper layer of the linked source ports. */
  readonly padLayer?: string
  /** Defaults to every board copper layer except `padLayer`. */
  readonly layerNames?: readonly string[]
  /** Defaults to a signal-only stack inferred from `pcb_board.num_layers`. */
  readonly stackup?: readonly StackupEntry[]
  /** Defaults to the same board-DRC formula used by core's breakout input. */
  readonly boundaryPointSpacing?: number
  /** Defaults to half of `boundaryPointSpacing`. */
  readonly breakoutStaggerOffset?: number
  /** Defaults to true and recognizes `NAME`/`NAME_n` source-trace names. */
  readonly inferDifferentialPairs?: boolean
  /** Bus bands, layer hints, and other expert-only solver controls. */
  readonly solverOverrides?: WindingBreakoutSolverOverrides
}

export interface LinkedBreakoutPoint {
  readonly pcbBreakoutPointId: string
  readonly pcbGroupId: string
  readonly sourcePortId: string
  readonly breakoutPosition: Point
  readonly portPosition: Point
  readonly portLayers: readonly string[]
}

export interface LinkedBreakoutPointPair {
  /** Source-trace name/display name, falling back to `sourceTraceId`. */
  readonly connectionId: string
  readonly sourceTraceId: string
  readonly points: readonly [LinkedBreakoutPoint, LinkedBreakoutPoint]
}

const fail = (message: string): never => {
  throw new WindingBreakoutInputError(
    `createWindingBreakoutInputFromCircuitJson: ${message}`,
  )
}

const getElements = <T extends AnyCircuitElement["type"]>(
  circuitJson: readonly AnyCircuitElement[],
  type: T,
): Extract<AnyCircuitElement, { type: T }>[] =>
  circuitJson.filter(
    (element): element is Extract<AnyCircuitElement, { type: T }> =>
      element.type === type,
  )

const getLayerName = (layer: unknown): string | undefined => {
  if (typeof layer === "string") return layer
  if (
    typeof layer === "object" &&
    layer !== null &&
    "name" in layer &&
    typeof layer.name === "string"
  ) {
    return layer.name
  }
  return undefined
}

const getConnectionId = (sourceTrace: SourceTrace | undefined): string =>
  sourceTrace?.name?.trim() ||
  sourceTrace?.display_name?.trim() ||
  sourceTrace?.source_trace_id ||
  fail("encountered a breakout-point pair without a source trace")

const findSourcePort = ({
  pcbPorts,
  point,
}: {
  pcbPorts: readonly PcbPort[]
  point: CircuitJsonBreakoutPoint
}): PcbPort => {
  const candidates = pcbPorts.filter(
    (port) => port.source_port_id === point.source_port_id,
  )
  const exactGroupCandidates = candidates.filter(
    (port) => port.pcb_group_id === point.pcb_group_id,
  )
  const matches =
    exactGroupCandidates.length > 0 ? exactGroupCandidates : candidates
  if (matches.length !== 1) {
    fail(
      `breakout point "${point.pcb_breakout_point_id}" must resolve to exactly one PCB port; found ${matches.length}`,
    )
  }
  return matches[0]!
}

/**
 * Finds reciprocal point-to-point breakout links produced by core. Two
 * breakout points are linked when they belong to different PCB groups and
 * carry the same `source_trace_id`.
 */
export const detectLinkedBreakoutPointPairs = (
  circuitJson: readonly AnyCircuitElement[],
): LinkedBreakoutPointPair[] => {
  const pcbPorts = getElements(circuitJson, "pcb_port") as PcbPort[]
  const sourceTraceById = new Map(
    (getElements(circuitJson, "source_trace") as SourceTrace[]).map(
      (sourceTrace) => [sourceTrace.source_trace_id, sourceTrace],
    ),
  )
  const pointsBySourceTraceId = new Map<string, CircuitJsonBreakoutPoint[]>()

  for (const point of getElements(
    circuitJson,
    "pcb_breakout_point",
  ) as CircuitJsonBreakoutPoint[]) {
    if (!point.source_trace_id || !point.source_port_id) continue
    const points = pointsBySourceTraceId.get(point.source_trace_id) ?? []
    points.push(point)
    pointsBySourceTraceId.set(point.source_trace_id, points)
  }

  const linkedPairs: LinkedBreakoutPointPair[] = []
  for (const [sourceTraceId, points] of pointsBySourceTraceId) {
    if (points.length !== 2) continue
    const [first, second] = points as [
      CircuitJsonBreakoutPoint,
      CircuitJsonBreakoutPoint,
    ]
    if (first.pcb_group_id === second.pcb_group_id) continue
    const sourceTrace = sourceTraceById.get(sourceTraceId)
    const toLinkedPoint = (
      point: CircuitJsonBreakoutPoint,
    ): LinkedBreakoutPoint => {
      const pcbPort = findSourcePort({ pcbPorts, point })
      return {
        pcbBreakoutPointId: point.pcb_breakout_point_id,
        pcbGroupId: point.pcb_group_id,
        sourcePortId: point.source_port_id!,
        breakoutPosition: { x: point.x, y: point.y },
        portPosition: { x: pcbPort.x, y: pcbPort.y },
        portLayers: pcbPort.layers
          .map(getLayerName)
          .filter((layer): layer is string => layer !== undefined),
      }
    }
    const pairPoints = [toLinkedPoint(first), toLinkedPoint(second)].sort(
      (a, b) => a.pcbGroupId.localeCompare(b.pcbGroupId),
    ) as [LinkedBreakoutPoint, LinkedBreakoutPoint]
    linkedPairs.push({
      connectionId: getConnectionId(sourceTrace),
      sourceTraceId,
      points: pairPoints,
    })
  }

  return linkedPairs.sort(
    (a, b) =>
      a.connectionId.localeCompare(b.connectionId) ||
      a.sourceTraceId.localeCompare(b.sourceTraceId),
  )
}

const getGroupPairKey = (firstId: string, secondId: string): string =>
  [firstId, secondId].sort().join("\u0000")

const getGroupLabel = (group: PcbGroup): string =>
  group.name ?? group.pcb_group_id

const resolveSelectedGroups = ({
  input,
  pcbGroups,
  linkedPairs,
}: {
  input: WindingBreakoutCircuitJsonInput
  pcbGroups: readonly PcbGroup[]
  linkedPairs: readonly LinkedBreakoutPointPair[]
}): readonly [PcbGroup, PcbGroup] => {
  if (input.breakoutGroupIds && input.breakoutGroupNames) {
    fail("provide breakoutGroupIds or breakoutGroupNames, not both")
  }
  const groupById = new Map(
    pcbGroups.map((group) => [group.pcb_group_id, group]),
  )

  if (input.breakoutGroupIds) {
    const missingGroupMessage = `could not find breakoutGroupIds ${input.breakoutGroupIds
      .map((id) => `"${id}"`)
      .join(" and ")}`
    const first =
      groupById.get(input.breakoutGroupIds[0]) ?? fail(missingGroupMessage)
    const second =
      groupById.get(input.breakoutGroupIds[1]) ?? fail(missingGroupMessage)
    if (first.pcb_group_id === second.pcb_group_id) {
      fail("the selected breakout groups must be distinct")
    }
    return [first, second]
  }

  if (input.breakoutGroupNames) {
    const groups = input.breakoutGroupNames.map((name) => {
      const matches = pcbGroups.filter((group) => group.name === name)
      if (matches.length !== 1) {
        fail(
          `breakout group name "${name}" must resolve exactly once; found ${matches.length}`,
        )
      }
      return matches[0]!
    })
    if (groups[0]!.pcb_group_id === groups[1]!.pcb_group_id) {
      fail("the selected breakout groups must be distinct")
    }
    return groups as [PcbGroup, PcbGroup]
  }

  const pairsByGroupPair = new Map<string, LinkedBreakoutPointPair[]>()
  for (const pair of linkedPairs) {
    const key = getGroupPairKey(
      pair.points[0].pcbGroupId,
      pair.points[1].pcbGroupId,
    )
    const pairs = pairsByGroupPair.get(key) ?? []
    pairs.push(pair)
    pairsByGroupPair.set(key, pairs)
  }
  if (pairsByGroupPair.size === 0) {
    fail("Circuit JSON contains no linked breakout-point pairs")
  }
  if (pairsByGroupPair.size > 1) {
    const candidates = [...pairsByGroupPair]
      .map(([key, pairs]) => {
        const [firstId, secondId] = key.split("\u0000") as [string, string]
        const first = groupById.get(firstId)
        const second = groupById.get(secondId)
        return `${first ? getGroupLabel(first) : firstId} ↔ ${second ? getGroupLabel(second) : secondId} (${pairs.length})`
      })
      .join(", ")
    fail(
      `multiple linked breakout group pairs were found; select one with breakoutGroupNames or breakoutGroupIds: ${candidates}`,
    )
  }

  const onlyKey =
    pairsByGroupPair.keys().next().value ??
    fail("could not resolve the linked breakout groups")
  const [firstId, secondId] = onlyKey.split("\u0000") as [string, string]
  const first =
    groupById.get(firstId) ??
    fail(`linked breakout point references missing PCB group "${firstId}"`)
  const second =
    groupById.get(secondId) ??
    fail(`linked breakout point references missing PCB group "${secondId}"`)

  const horizontal =
    Math.abs(second.center.x - first.center.x) >=
    Math.abs(second.center.y - first.center.y)
  const sorted = [first, second].sort((a, b) =>
    horizontal
      ? a.center.x - b.center.x || a.pcb_group_id.localeCompare(b.pcb_group_id)
      : a.center.y - b.center.y || a.pcb_group_id.localeCompare(b.pcb_group_id),
  )
  return sorted as [PcbGroup, PcbGroup]
}

const getFacingEdges = (
  first: PcbGroup,
  second: PcbGroup,
): readonly [BreakoutEdge, BreakoutEdge] => {
  const dx = second.center.x - first.center.x
  const dy = second.center.y - first.center.y
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? ["right", "left"] : ["left", "right"]
  }
  return dy >= 0 ? ["top", "bottom"] : ["bottom", "top"]
}

const getComponentGeometry = ({
  group,
  pcbComponents,
}: {
  group: PcbGroup
  pcbComponents: readonly PcbComponent[]
}): { center: Point; width: number; height: number } => {
  const components = pcbComponents.filter(
    (component) =>
      component.pcb_group_id === group.pcb_group_id ||
      group.pcb_component_ids.includes(component.pcb_component_id),
  )
  if (components.length === 0) {
    return {
      center: group.center,
      width: group.width!,
      height: group.height!,
    }
  }
  const minX = Math.min(
    ...components.map((component) => component.center.x - component.width / 2),
  )
  const maxX = Math.max(
    ...components.map((component) => component.center.x + component.width / 2),
  )
  const minY = Math.min(
    ...components.map((component) => component.center.y - component.height / 2),
  )
  const maxY = Math.max(
    ...components.map((component) => component.center.y + component.height / 2),
  )
  return {
    center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
    width: maxX - minX,
    height: maxY - minY,
  }
}

const getBoardLayers = (layerCount: number): string[] => {
  if (layerCount <= 1) return ["top"]
  return [
    "top",
    ...Array.from(
      { length: Math.max(0, layerCount - 2) },
      (_, index) => `inner${index + 1}`,
    ),
    "bottom",
  ]
}

const findBoard = (
  boards: readonly PcbBoard[],
  groups: readonly [PcbGroup, PcbGroup],
): PcbBoard | undefined => {
  const subcircuitId = groups[0].subcircuit_id
  return (
    boards.find(
      (board) =>
        board.subcircuit_id === subcircuitId &&
        groups[1].subcircuit_id === subcircuitId,
    ) ?? boards[0]
  )
}

const inferPadLayer = (pairs: readonly LinkedBreakoutPointPair[]): string => {
  const endpoints = pairs.flatMap((pair) => pair.points)
  const commonLayers = endpoints[0]?.portLayers.filter((layer) =>
    endpoints.every((endpoint) => endpoint.portLayers.includes(layer)),
  )
  const preferred = ["top", "bottom", ...(commonLayers ?? [])].find((layer) =>
    commonLayers?.includes(layer),
  )
  return preferred ?? fail("linked breakout ports do not share a pad layer")
}

const inferDifferentialPairs = (
  connectionIds: readonly string[],
): DifferentialPairInput[] => {
  const connectionSet = new Set(connectionIds)
  return connectionIds.flatMap((negative) => {
    if (!negative.endsWith("_n")) return []
    const positive = negative.slice(0, -2)
    return connectionSet.has(positive) ? [{ positive, negative }] : []
  })
}

const getBoundaryPointSpacing = (board: PcbBoard | undefined): number => {
  const traceWidth = board?.min_trace_width ?? 0.15
  const boundaryPointClearance = board?.min_trace_to_pad_edge_clearance ?? 0.2
  const viaPadDiameter = board?.min_via_pad_diameter ?? 0.3
  return viaPadDiameter + 2 * (traceWidth + boundaryPointClearance)
}

/**
 * Builds the solver's normalized input from ordinary core output. Core and its
 * existing breakout solver remain responsible for component geometry and the
 * first-pass breakout records; this adapter only coordinates reciprocal pairs.
 */
export const createWindingBreakoutInputFromCircuitJson = (
  input: WindingBreakoutCircuitJsonInput,
): WindingBreakoutSolverInput => {
  const pcbGroups = getElements(input.circuitJson, "pcb_group") as PcbGroup[]
  const linkedPairs = detectLinkedBreakoutPointPairs(input.circuitJson)
  const selectedGroups = resolveSelectedGroups({
    input,
    pcbGroups,
    linkedPairs,
  })
  for (const group of selectedGroups) {
    if (!group.width || !group.height) {
      fail(
        `breakout group "${getGroupLabel(group)}" needs rectangular width and height`,
      )
    }
  }

  const selectedPairKey = getGroupPairKey(
    selectedGroups[0].pcb_group_id,
    selectedGroups[1].pcb_group_id,
  )
  let selectedPairs = linkedPairs.filter(
    (pair) =>
      getGroupPairKey(pair.points[0].pcbGroupId, pair.points[1].pcbGroupId) ===
      selectedPairKey,
  )
  if (input.connectionIds) {
    const requested = new Set(input.connectionIds)
    selectedPairs = selectedPairs.filter(
      (pair) =>
        requested.has(pair.connectionId) || requested.has(pair.sourceTraceId),
    )
    const detectedIds = new Set(
      selectedPairs.flatMap((pair) => [pair.connectionId, pair.sourceTraceId]),
    )
    const missing = input.connectionIds.filter((id) => !detectedIds.has(id))
    if (missing.length > 0) {
      fail(`requested connections were not linked: ${missing.join(", ")}`)
    }
  }
  if (selectedPairs.length === 0) {
    fail("the selected breakout groups contain no linked point pairs")
  }
  const connectionIds = selectedPairs.map((pair) => pair.connectionId)
  if (new Set(connectionIds).size !== connectionIds.length) {
    fail(
      "linked source traces must have unique names; rename duplicate <trace name=...> values or leave them unnamed",
    )
  }

  const boards = getElements(input.circuitJson, "pcb_board") as PcbBoard[]
  const board = findBoard(boards, selectedGroups)
  const padLayer = input.padLayer ?? inferPadLayer(selectedPairs)
  const inferredStackup = getBoardLayers(board?.num_layers ?? 2).map(
    (id): StackupEntry => ({ id, type: "signal" }),
  )
  const stackup = [...(input.stackup ?? inferredStackup)]
  const layerNames = [
    ...(input.layerNames ??
      stackup
        .filter((entry) => entry.type === "signal" && entry.id !== padLayer)
        .map((entry) => entry.id)),
  ]
  if (layerNames.length === 0) {
    fail("at least one routing layer other than padLayer is required")
  }

  const pcbComponents = getElements(
    input.circuitJson,
    "pcb_component",
  ) as PcbComponent[]
  const facingEdges = getFacingEdges(selectedGroups[0], selectedGroups[1])
  const regions: WindingBreakoutRegion[] = selectedGroups.map(
    (group, groupIndex) => {
      const component = getComponentGeometry({ group, pcbComponents })
      return {
        id: group.pcb_group_id,
        label: group.name,
        center: component.center,
        component: { width: component.width, height: component.height },
        padGrid: {
          columns: 1,
          rows: 1,
          pitchX: 1,
          pitchY: 1,
          padRadius: 0.1,
        },
        bounds: {
          minX: group.center.x - group.width! / 2,
          maxX: group.center.x + group.width! / 2,
          minY: group.center.y - group.height! / 2,
          maxY: group.center.y + group.height! / 2,
        },
        edge: facingEdges[groupIndex]!,
        ports: selectedPairs.map((pair) => {
          const endpoint = pair.points.find(
            (point) => point.pcbGroupId === group.pcb_group_id,
          )
          if (!endpoint) {
            return fail(
              `connection "${pair.connectionId}" is missing from breakout group "${getGroupLabel(group)}"`,
            )
          }
          return {
            connectionId: pair.connectionId,
            position: endpoint.portPosition,
          }
        }),
      }
    },
  )

  const boundaryPointSpacing =
    input.boundaryPointSpacing ?? getBoundaryPointSpacing(board)
  const inferredPairs = inferDifferentialPairs(connectionIds)
  const solverOverrides = input.solverOverrides ?? {}

  return {
    ...solverOverrides,
    regions,
    padLayer,
    layerNames,
    stackup,
    boundaryPointSpacing,
    breakoutStaggerOffset:
      input.breakoutStaggerOffset ?? boundaryPointSpacing / 2,
    differentialPairs:
      solverOverrides.differentialPairs ??
      (input.inferDifferentialPairs === false ? [] : inferredPairs),
    busLocalOptimization: solverOverrides.busLocalOptimization ?? false,
  }
}
