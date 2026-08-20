import type {
  Bounds,
  ConnectionEndpoint,
  Point,
  WindingBreakoutRegion,
  WindingBreakoutSolverInput,
} from "../types"
import { WindingBreakoutInputError } from "./errors"

export interface ValidatedRegion extends WindingBreakoutRegion {
  readonly center: Point
}

export interface ValidatedConnection {
  readonly id: string
  readonly layer: string
  readonly endpoints: readonly ConnectionEndpoint[]
}

export interface ValidatedWindingInput {
  readonly regions: readonly ValidatedRegion[]
  readonly connections: readonly ValidatedConnection[]
  readonly layerNames: readonly string[]
  readonly atomicConnectionGroups: readonly (readonly [string, string])[]
}

const fail = (message: string): never => {
  throw new WindingBreakoutInputError(`WindingBreakoutSolver: ${message}`)
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const requireRecord: (
  value: unknown,
  label: string,
) => asserts value is Record<string, unknown> = (value, label) => {
  if (!isRecord(value)) fail(`${label} must be an object`)
}

const requireId: (value: unknown, label: string) => asserts value is string = (
  value,
  label,
) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    fail(`${label} must be a non-empty string`)
  }
}

const requireFinite: (
  value: unknown,
  label: string,
) => asserts value is number = (value, label) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    fail(`${label} must be finite`)
  }
}

const requirePositive = (value: unknown, label: string): void => {
  requireFinite(value, label)
  if (value <= 0) fail(`${label} must be positive`)
}

const requireArray = (value: unknown, message: string): unknown[] => {
  if (Array.isArray(value)) return value
  return fail(message)
}

const validatePoint = (value: unknown, label: string): Point => {
  requireRecord(value, label)
  requireFinite(value.x, `${label}.x`)
  requireFinite(value.y, `${label}.y`)
  return value as unknown as Point
}

const validateBounds = (value: unknown, label: string): Bounds => {
  requireRecord(value, label)
  requireFinite(value.minX, `${label}.minX`)
  requireFinite(value.maxX, `${label}.maxX`)
  requireFinite(value.minY, `${label}.minY`)
  requireFinite(value.maxY, `${label}.maxY`)
  if (value.minX >= value.maxX || value.minY >= value.maxY) {
    fail(`${label} must have positive width and height`)
  }
  return {
    minX: value.minX,
    maxX: value.maxX,
    minY: value.minY,
    maxY: value.maxY,
  }
}

const pointIsInsideBounds = (point: Point, bounds: Bounds): boolean =>
  point.x >= bounds.minX &&
  point.x <= bounds.maxX &&
  point.y >= bounds.minY &&
  point.y <= bounds.maxY

export const validateWindingBreakoutInput = (
  input: WindingBreakoutSolverInput,
): ValidatedWindingInput => {
  if (!Array.isArray(input.regions) || input.regions.length < 2) {
    fail("at least two regions are required")
  }
  requirePositive(input.boundaryPointSpacing, "boundaryPointSpacing")

  const regionIds = new Set<string>()
  const regions: ValidatedRegion[] = input.regions.map((value, index) => {
    requireRecord(value, `regions[${index}]`)
    requireId(value.id, `regions[${index}].id`)
    if (regionIds.has(value.id)) fail(`duplicate region id "${value.id}"`)
    regionIds.add(value.id)
    const bounds = validateBounds(value.bounds, `region "${value.id}" bounds`)
    if (
      typeof value.edge !== "string" ||
      !new Set(["left", "right", "bottom", "top"]).has(value.edge)
    ) {
      fail(`region "${value.id}" has invalid edge`)
    }
    return {
      id: value.id,
      bounds,
      edge: value.edge as WindingBreakoutRegion["edge"],
      center: {
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2,
      },
    }
  })

  const vertical = regions.every(
    (region) => region.edge === "left" || region.edge === "right",
  )
  const horizontal = regions.every(
    (region) => region.edge === "bottom" || region.edge === "top",
  )
  if (!vertical && !horizontal) {
    fail("all coordinated region edges must be parallel")
  }

  if (!Array.isArray(input.connections) || input.connections.length === 0) {
    fail("at least one connection is required")
  }

  const connections: ValidatedConnection[] = []
  const connectionIds = new Set<string>()
  const atomicConnectionGroups: Array<readonly [string, string]> = []

  const validateConnection = (
    value: unknown,
    label: string,
    inheritedLayer?: string,
  ): ValidatedConnection => {
    requireRecord(value, label)
    requireId(value.id, `${label}.id`)
    if (connectionIds.has(value.id)) {
      fail(`duplicate connection id "${value.id}"`)
    }

    let layer: string
    if (inheritedLayer === undefined) {
      requireId(value.layer, `${label}.layer`)
      layer = value.layer
    } else {
      if ("layer" in value) {
        fail(`${label} must inherit its differential-pair layer`)
      }
      layer = inheritedLayer
    }

    const endpointValues = requireArray(
      value.endpoints,
      `${label}.endpoints must be an array`,
    )
    const endpointRegionIds = new Set<string>()
    const endpoints: ConnectionEndpoint[] = endpointValues.map(
      (endpointValue, endpointIndex) => {
        const endpointLabel = `${label}.endpoints[${endpointIndex}]`
        requireRecord(endpointValue, endpointLabel)
        requireId(endpointValue.regionId, `${endpointLabel}.regionId`)
        if (!regionIds.has(endpointValue.regionId)) {
          fail(
            `${endpointLabel} references unknown region "${endpointValue.regionId}"`,
          )
        }
        if (endpointRegionIds.has(endpointValue.regionId)) {
          fail(
            `${label} has duplicate endpoint for region "${endpointValue.regionId}"`,
          )
        }
        endpointRegionIds.add(endpointValue.regionId)
        const position = validatePoint(
          endpointValue.position,
          `${endpointLabel}.position`,
        )
        const region = regions.find(
          (candidate) => candidate.id === endpointValue.regionId,
        )!
        if (!pointIsInsideBounds(position, region.bounds)) {
          fail(
            `${label} endpoint for region "${region.id}" is outside its bounds`,
          )
        }
        return { regionId: endpointValue.regionId, position }
      },
    )

    for (const region of regions) {
      if (!endpointRegionIds.has(region.id)) {
        fail(`${label} is missing endpoint for region "${region.id}"`)
      }
    }
    if (endpoints.length !== regions.length) {
      fail(`${label} must contain exactly one endpoint for every region`)
    }

    connectionIds.add(value.id)
    return { id: value.id, layer, endpoints }
  }

  for (const [index, value] of input.connections.entries()) {
    const label = `connections[${index}]`
    requireRecord(value, label)
    if ("type" in value || "connections" in value) {
      if (value.type !== "differential") {
        fail(`${label} has invalid differential-pair type`)
      }
      requireId(value.layer, `${label}.layer`)
      const pairConnections = requireArray(
        value.connections,
        `${label}.connections must contain exactly two members`,
      )
      if (pairConnections.length !== 2) {
        fail(`${label}.connections must contain exactly two members`)
      }
      const first = validateConnection(
        pairConnections[0],
        `${label}.connections[0]`,
        value.layer,
      )
      const second = validateConnection(
        pairConnections[1],
        `${label}.connections[1]`,
        value.layer,
      )
      if (first.id === second.id) {
        fail(`${label} members must have distinct connection ids`)
      }
      connections.push(first, second)
      atomicConnectionGroups.push([first.id, second.id])
    } else {
      connections.push(validateConnection(value, label))
    }
  }

  const layerNames = [
    ...new Set(connections.map((connection) => connection.layer)),
  ].sort((first, second) => first.localeCompare(second))
  return { regions, connections, layerNames, atomicConnectionGroups }
}
