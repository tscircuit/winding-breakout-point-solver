import type { AnyCircuitElement } from "circuit-json"
import { createWindingBreakoutInputFromCircuitJson } from "../../lib/input/create-winding-breakout-input-from-circuit-json"
import type {
  BreakoutBand,
  WindingBreakoutExample,
  WindingBreakoutExampleMetadata,
} from "../../lib/types"
import { AM62L_CIRCUIT_JSON } from "./am62l-circuit-json.generated"
import {
  DDR_BUS_ORDER,
  DDR_CONNECTIONS,
  type DdrBusName,
} from "./ddr-connections"

interface ExampleOptions extends WindingBreakoutExampleMetadata {
  readonly buses: readonly DdrBusName[]
}

const BUS_BANDS: Readonly<Record<DdrBusName, BreakoutBand>> = {
  DDR_BYTE1: { min: 1.25, max: 4.75, position: "upper" },
  DDR_ADDR_CTRL: { min: -1.75, max: 1.75, position: "center" },
  DDR_BYTE0: { min: -4.75, max: -1.25, position: "lower" },
}

/** Compact snapshot produced from the canonical core circuit at development time. */
export const getAm62lCircuitJson = async (): Promise<
  readonly AnyCircuitElement[]
> => AM62L_CIRCUIT_JSON

const selectConnections = (
  circuitJson: readonly AnyCircuitElement[],
  connectionIds: readonly string[],
): AnyCircuitElement[] => {
  const requestedConnections = new Set(connectionIds)
  const sourceTraceIds = new Set(
    circuitJson.flatMap((element) =>
      element.type === "source_trace" &&
      element.name &&
      requestedConnections.has(element.name)
        ? [element.source_trace_id]
        : [],
    ),
  )
  const sourcePortIds = new Set(
    circuitJson.flatMap((element) =>
      element.type === "pcb_breakout_point" &&
      element.source_trace_id &&
      sourceTraceIds.has(element.source_trace_id) &&
      element.source_port_id
        ? [element.source_port_id]
        : [],
    ),
  )

  return circuitJson.filter((element) => {
    if (element.type === "source_trace") {
      return sourceTraceIds.has(element.source_trace_id)
    }
    if (element.type === "pcb_breakout_point") {
      return (
        element.source_trace_id !== undefined &&
        sourceTraceIds.has(element.source_trace_id)
      )
    }
    if (element.type === "pcb_port") {
      return sourcePortIds.has(element.source_port_id)
    }
    return true
  })
}

export const createAm62lExample = async (
  options: ExampleOptions,
): Promise<WindingBreakoutExample> => {
  const selectedBuses = DDR_BUS_ORDER.filter((busName) =>
    options.buses.includes(busName),
  )
  const selectedConnections = DDR_CONNECTIONS.filter((connection) =>
    selectedBuses.includes(connection.busName),
  )
  const connectionIds = selectedConnections.map(
    (connection) => connection.traceName,
  )

  const input = createWindingBreakoutInputFromCircuitJson({
    circuitJson: selectConnections(await getAm62lCircuitJson(), connectionIds),
    solverOverrides: {
      busLocalOptimization: true,
      busByConnection: Object.fromEntries(
        selectedConnections.map((connection) => [
          connection.traceName,
          connection.busName,
        ]),
      ),
      busIds: selectedBuses,
      busBands: Object.fromEntries(
        selectedBuses.map((busName) => [busName, BUS_BANDS[busName]]),
      ),
      preserveWinding: true,
      allowDiagnosticBestEffort: true,
    },
  })

  return {
    ...input,
    sample: {
      id: options.id,
      label: options.label,
      shortLabel: options.shortLabel,
      description: options.description,
      sourceFile: options.sourceFile,
    },
  }
}
