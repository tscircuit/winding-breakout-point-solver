import { Circuit } from "@tscircuit/core"
import type { AnyCircuitElement } from "circuit-json"
import { createWindingBreakoutInputFromCircuitJson } from "../../lib/input/create-winding-breakout-input-from-circuit-json"
import type {
  BreakoutBand,
  StackupEntry,
  WindingBreakoutExample,
  WindingBreakoutExampleMetadata,
} from "../../lib/types"
import { Am62lLpddr4Circuit } from "./am62l-circuit"
import {
  DDR_BUS_ORDER,
  DDR_CONNECTIONS,
  type DdrBusName,
} from "./ddr-connections"

interface ExampleOptions extends WindingBreakoutExampleMetadata {
  readonly buses: readonly DdrBusName[]
}

const AM62L_STACKUP: readonly StackupEntry[] = [
  { id: "top", type: "signal" },
  { id: "gnd_top", type: "plane", solid: true, net: "GND" },
  { id: "inner1", type: "signal" },
  { id: "inner2", type: "signal" },
  { id: "gnd_mid_1", type: "plane", solid: true, net: "GND" },
  { id: "inner3", type: "signal" },
  { id: "inner4", type: "signal" },
  { id: "gnd_mid_2", type: "plane", solid: true, net: "GND" },
  { id: "inner5", type: "signal" },
  { id: "inner6", type: "signal" },
  { id: "gnd_bottom", type: "plane", solid: true, net: "GND" },
  { id: "bottom", type: "signal" },
]

const BUS_BANDS: Readonly<Record<DdrBusName, BreakoutBand>> = {
  DDR_BYTE1: { min: 1.75, max: 4.25, position: "upper" },
  DDR_ADDR_CTRL: { min: -1.25, max: 1.25, position: "center" },
  DDR_BYTE0: { min: -4.25, max: -1.75, position: "lower" },
}

let circuitJsonPromise: Promise<readonly AnyCircuitElement[]> | undefined

/** Render once so all four example variants share the same core output. */
export const getAm62lCircuitJson = (): Promise<
  readonly AnyCircuitElement[]
> => {
  circuitJsonPromise ??= (async () => {
    const circuit = new Circuit()
    circuit.add(Am62lLpddr4Circuit())
    await circuit.renderUntilSettled()
    return circuit.getCircuitJson()
  })()
  return circuitJsonPromise
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
    circuitJson: await getAm62lCircuitJson(),
    breakoutGroupNames: ["SOC_BREAKOUT", "RAM_BREAKOUT"],
    connectionIds,
    stackup: AM62L_STACKUP,
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
