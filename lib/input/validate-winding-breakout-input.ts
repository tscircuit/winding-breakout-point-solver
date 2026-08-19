import type {
  BreakoutBand,
  Bounds,
  Point,
  WindingBreakoutSolverInput,
} from "../types"
import { WindingBreakoutInputError } from "./errors"

export interface ValidatedWindingInput {
  readonly connectionIds: readonly string[]
  readonly busIds: readonly string[]
  readonly busByConnection: Readonly<Record<string, string>>
  readonly busBands: Readonly<Record<string, BreakoutBand>>
}

const fail = (message: string): never => {
  throw new WindingBreakoutInputError(`WindingBreakoutSolver: ${message}`)
}

const requireId = (value: string, label: string): void => {
  if (typeof value !== "string" || value.trim().length === 0) {
    fail(`${label} must be a non-empty string`)
  }
}

const requireFinite = (value: number, label: string): void => {
  if (!Number.isFinite(value)) fail(`${label} must be finite`)
}

const requirePositive = (value: number, label: string): void => {
  requireFinite(value, label)
  if (value <= 0) fail(`${label} must be positive`)
}

const validatePoint = (point: Point, label: string): void => {
  requireFinite(point.x, `${label}.x`)
  requireFinite(point.y, `${label}.y`)
}

const validateBounds = (bounds: Bounds, label: string): void => {
  requireFinite(bounds.minX, `${label}.minX`)
  requireFinite(bounds.maxX, `${label}.maxX`)
  requireFinite(bounds.minY, `${label}.minY`)
  requireFinite(bounds.maxY, `${label}.maxY`)
  if (bounds.minX >= bounds.maxX || bounds.minY >= bounds.maxY) {
    fail(`${label} must have positive width and height`)
  }
}

const validateLayerHints = (
  hints: Readonly<Record<string, string>> | undefined,
  label: string,
  connectionIds: ReadonlySet<string>,
  layerNames: ReadonlySet<string>,
): void => {
  if (!hints) return
  for (const [connectionId, layer] of Object.entries(hints)) {
    if (!connectionIds.has(connectionId)) {
      fail(`${label} references unknown connection "${connectionId}"`)
    }
    requireId(layer, `${label}.${connectionId}`)
    if (!layerNames.has(layer)) {
      fail(
        `${label}.${connectionId} references unknown routing layer "${layer}"`,
      )
    }
  }
}

const validateKnownBusRecord = (
  record: Readonly<Record<string, unknown>> | undefined,
  label: string,
  declaredBusIds: ReadonlySet<string>,
): void => {
  for (const busId of Object.keys(record ?? {})) {
    if (!declaredBusIds.has(busId)) {
      fail(`${label} references unknown bus "${busId}"`)
    }
  }
}

export const validateWindingBreakoutInput = (
  input: WindingBreakoutSolverInput,
): ValidatedWindingInput => {
  if (!Array.isArray(input.regions) || input.regions.length < 2) {
    fail("at least two regions are required")
  }
  requireId(input.padLayer, "padLayer")
  requirePositive(input.boundaryPointSpacing, "boundaryPointSpacing")
  requireFinite(input.breakoutStaggerOffset, "breakoutStaggerOffset")
  if (input.breakoutStaggerOffset < 0) {
    fail("breakoutStaggerOffset must be non-negative")
  }
  if (!Array.isArray(input.layerNames) || input.layerNames.length === 0) {
    fail("at least one routing layer is required")
  }
  const routingLayerSet = new Set(input.layerNames)
  if (routingLayerSet.size !== input.layerNames.length) {
    fail("routing layer ids must be unique")
  }
  if (routingLayerSet.has(input.padLayer)) {
    fail("padLayer must be reserved for pad stubs and vias")
  }
  for (const layer of input.layerNames) requireId(layer, "routing layer id")

  if (!Array.isArray(input.stackup) || input.stackup.length === 0) {
    fail("stackup is required")
  }
  const stackupIds = new Set<string>()
  for (const entry of input.stackup) {
    requireId(entry.id, "stackup id")
    if (stackupIds.has(entry.id)) fail(`duplicate stackup id "${entry.id}"`)
    stackupIds.add(entry.id)
  }
  const padEntry =
    input.stackup.find((entry) => entry.id === input.padLayer) ??
    fail(`stackup is missing pad layer "${input.padLayer}"`)
  if (padEntry.type !== "signal") fail("padLayer must be a signal layer")
  for (const layer of input.layerNames) {
    const entry =
      input.stackup.find((candidate) => candidate.id === layer) ??
      fail(`stackup is missing routing layer "${layer}"`)
    if (entry.type !== "signal") fail(`routing layer "${layer}" must be signal`)
  }

  const regionIds = new Set<string>()
  const firstRegion = input.regions[0]!
  if (firstRegion.ports.length === 0) fail("the first region has no ports")
  const connectionIds = firstRegion.ports.map((port) => port.connectionId)
  const connectionSet = new Set(connectionIds)
  if (connectionSet.size !== connectionIds.length) {
    fail("the first region has duplicate connections")
  }
  for (const connectionId of connectionIds) {
    requireId(connectionId, "connection id")
  }
  for (const region of input.regions) {
    requireId(region.id, "region id")
    if (regionIds.has(region.id)) fail(`duplicate region id "${region.id}"`)
    regionIds.add(region.id)
    validatePoint(region.center, `region "${region.id}" center`)
    validateBounds(region.bounds, `region "${region.id}" bounds`)
    requirePositive(
      region.component.width,
      `region "${region.id}" component.width`,
    )
    requirePositive(
      region.component.height,
      `region "${region.id}" component.height`,
    )
    const grid = region.padGrid
    if (!Number.isInteger(grid.columns) || grid.columns <= 0) {
      fail(`region "${region.id}" padGrid.columns must be a positive integer`)
    }
    if (!Number.isInteger(grid.rows) || grid.rows <= 0) {
      fail(`region "${region.id}" padGrid.rows must be a positive integer`)
    }
    requirePositive(grid.pitchX, `region "${region.id}" padGrid.pitchX`)
    requirePositive(grid.pitchY, `region "${region.id}" padGrid.pitchY`)
    requirePositive(grid.padRadius, `region "${region.id}" padGrid.padRadius`)
    const ids = region.ports.map((port) => port.connectionId)
    if (
      ids.length !== connectionSet.size ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => !connectionSet.has(id))
    ) {
      fail(
        `region "${region.id}" must contain the first region's unique connection set`,
      )
    }
    for (const port of region.ports) {
      validatePoint(
        port.position,
        `region "${region.id}" port "${port.connectionId}"`,
      )
      if (
        port.position.x < region.bounds.minX ||
        port.position.x > region.bounds.maxX ||
        port.position.y < region.bounds.minY ||
        port.position.y > region.bounds.maxY
      ) {
        fail(
          `region "${region.id}" port "${port.connectionId}" is outside bounds`,
        )
      }
    }
  }

  const groupedConnections = new Map<string, string>()
  for (const [groupIndex, group] of (
    input.atomicConnectionGroups ?? []
  ).entries()) {
    if (group.length < 2) {
      fail(`atomicConnectionGroups[${groupIndex}] needs at least two members`)
    }
    if (new Set(group).size !== group.length) {
      fail(`atomicConnectionGroups[${groupIndex}] contains duplicate members`)
    }
    for (const connectionId of group) {
      if (!connectionSet.has(connectionId)) {
        fail(`atomic group references unknown connection "${connectionId}"`)
      }
      if (groupedConnections.has(connectionId)) {
        fail(`connection "${connectionId}" belongs to multiple atomic groups`)
      }
      groupedConnections.set(connectionId, `atomic:${groupIndex}`)
    }
  }
  const pairedConnections = new Set<string>()
  for (const [pairIndex, pair] of (input.differentialPairs ?? []).entries()) {
    if (
      !connectionSet.has(pair.positive) ||
      !connectionSet.has(pair.negative)
    ) {
      fail(`differentialPairs[${pairIndex}] references an unknown connection`)
    }
    if (pair.positive === pair.negative) {
      fail(`differentialPairs[${pairIndex}] members must be distinct`)
    }
    if (pair.targetSpacing !== undefined) {
      requirePositive(
        pair.targetSpacing,
        `differentialPairs[${pairIndex}].targetSpacing`,
      )
    }
    if (
      pairedConnections.has(pair.positive) ||
      pairedConnections.has(pair.negative)
    ) {
      fail("a connection cannot belong to more than one differential pair")
    }
    pairedConnections.add(pair.positive)
    pairedConnections.add(pair.negative)
    const positiveGroup = groupedConnections.get(pair.positive)
    const negativeGroup = groupedConnections.get(pair.negative)
    if (positiveGroup !== negativeGroup && (positiveGroup || negativeGroup)) {
      fail("differential-pair members must belong to the same atomic group")
    }
  }

  if (input.referenceOrder) {
    const referenceSet = new Set(input.referenceOrder)
    if (
      referenceSet.size !== connectionSet.size ||
      input.referenceOrder.length !== connectionSet.size ||
      input.referenceOrder.some((id) => !connectionSet.has(id))
    ) {
      fail("referenceOrder must contain every connection exactly once")
    }
  }
  if (
    input.maxSearchNodes !== undefined &&
    (!Number.isInteger(input.maxSearchNodes) || input.maxSearchNodes <= 0)
  ) {
    fail("maxSearchNodes must be a positive integer")
  }
  if (input.layerBreakoutOffsets) {
    for (const [layer, offset] of Object.entries(input.layerBreakoutOffsets)) {
      if (!routingLayerSet.has(layer)) {
        fail(`layerBreakoutOffsets references unknown layer "${layer}"`)
      }
      requireFinite(offset, `layerBreakoutOffsets.${layer}`)
    }
  }
  validateLayerHints(
    input.initialLayerByConnection,
    "initialLayerByConnection",
    connectionSet,
    routingLayerSet,
  )

  const useBusScoping = input.busLocalOptimization !== false
  const providedBusIds = [...(input.busIds ?? [])]
  if (new Set(providedBusIds).size !== providedBusIds.length) {
    fail("bus ids must be unique")
  }
  const providedBusSet = new Set(providedBusIds)
  validateKnownBusRecord(input.busBands, "busBands", providedBusSet)
  validateKnownBusRecord(
    input.referenceOrderByBus,
    "referenceOrderByBus",
    providedBusSet,
  )
  validateKnownBusRecord(
    input.initialLayerByBus,
    "initialLayerByBus",
    providedBusSet,
  )
  validateKnownBusRecord(
    input.preserveWindingByBus,
    "preserveWindingByBus",
    providedBusSet,
  )
  for (const connectionId of Object.keys(input.busByConnection ?? {})) {
    if (!connectionSet.has(connectionId)) {
      fail(`busByConnection references unknown connection "${connectionId}"`)
    }
  }
  for (const [busId, band] of Object.entries(input.busBands ?? {})) {
    requireFinite(band.min, `busBands.${busId}.min`)
    requireFinite(band.max, `busBands.${busId}.max`)
    if (band.min >= band.max) fail(`busBands.${busId} must have positive span`)
  }
  if (providedBusIds.length > 0) {
    for (const connectionId of connectionIds) {
      const mappedBus =
        input.busByConnection?.[connectionId] ??
        fail(`connection "${connectionId}" has no declared bus`)
      if (!providedBusSet.has(mappedBus)) {
        fail(
          `connection "${connectionId}" references unknown bus "${mappedBus}"`,
        )
      }
    }
    for (const busId of providedBusIds) {
      const busConnections = new Set(
        connectionIds.filter(
          (connectionId) => input.busByConnection?.[connectionId] === busId,
        ),
      )
      if (busConnections.size === 0) fail(`bus "${busId}" has no connections`)
      validateLayerHints(
        input.initialLayerByBus?.[busId],
        `initialLayerByBus.${busId}`,
        busConnections,
        routingLayerSet,
      )
      const reference = input.referenceOrderByBus?.[busId]
      if (
        reference &&
        (reference.length !== busConnections.size ||
          new Set(reference).size !== reference.length ||
          reference.some((id) => !busConnections.has(id)))
      ) {
        fail(
          `referenceOrderByBus.${busId} must contain every bus connection once`,
        )
      }
    }
  }
  const busIds = useBusScoping ? providedBusIds : ["GLOBAL"]
  if (useBusScoping && providedBusIds.length === 0) {
    fail("busLocalOptimization requires at least one bus id")
  }
  const busByConnection: Record<string, string> = {}
  const busBands: Record<string, BreakoutBand> = {}
  if (useBusScoping) {
    for (const busId of busIds) {
      requireId(busId, "bus id")
      const band =
        input.busBands?.[busId] ??
        fail(`missing breakout band for bus "${busId}"`)
      busBands[busId] = band
    }
    for (const connectionId of connectionIds) {
      const busId =
        input.busByConnection?.[connectionId] ??
        fail(`connection "${connectionId}" has no declared bus`)
      if (!busIds.includes(busId))
        fail(`connection "${connectionId}" has no declared bus`)
      busByConnection[connectionId] = busId
    }
    for (const pair of input.differentialPairs ?? []) {
      if (busByConnection[pair.positive] !== busByConnection[pair.negative]) {
        fail(
          `differential pair ${pair.positive}/${pair.negative} crosses bus boundaries`,
        )
      }
    }
    for (const [groupIndex, group] of (
      input.atomicConnectionGroups ?? []
    ).entries()) {
      if (new Set(group.map((id) => busByConnection[id])).size !== 1) {
        fail(`atomicConnectionGroups[${groupIndex}] crosses bus boundaries`)
      }
    }
    for (const busId of busIds) {
      if (!connectionIds.some((id) => busByConnection[id] === busId)) {
        fail(`bus "${busId}" has no connections`)
      }
    }
  } else {
    const vertical = input.regions.every(
      (region) => region.edge === "left" || region.edge === "right",
    )
    const min = Math.max(
      ...input.regions.map((region) =>
        vertical ? region.bounds.minY : region.bounds.minX,
      ),
    )
    const max = Math.min(
      ...input.regions.map((region) =>
        vertical ? region.bounds.maxY : region.bounds.maxX,
      ),
    )
    busBands.GLOBAL = { min, max }
    for (const connectionId of connectionIds)
      busByConnection[connectionId] = "GLOBAL"
  }

  return { connectionIds, busIds, busByConnection, busBands }
}
