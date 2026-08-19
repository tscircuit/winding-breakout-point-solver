import { MT53E1G16D1ZW, ballMap } from "@tsci/0hmX.mt53e1g16d1zw-footprint"
import { AM62L32 } from "@tsci/tscircuit.ti"
import {
  DDR_CONNECTIONS,
  DDR_SOC_PHYSICAL_PINS,
  getTraceNamesForBus,
} from "./ddr-connections"

const usedSocPins = new Set<number>(DDR_SOC_PHYSICAL_PINS)
const socNoConnect = Array.from({ length: 373 }, (_, index) => index + 1)
  .filter((pin) => !usedSocPins.has(pin))
  .map((pin) => `pin${pin}`)

const usedMemorySignals = new Set(
  DDR_CONNECTIONS.map((connection) => connection.memorySignal),
)
const memoryNoConnect = ballMap
  .map(({ signal }, index) => ({ signal, selector: `pin${index + 1}` }))
  .filter(({ signal }) => !usedMemorySignals.has(signal))
  .map(({ selector }) => selector)

const SIGNAL_LAYERS = [
  "top",
  "inner1",
  "inner2",
  "inner3",
  "inner4",
  "inner5",
  "inner6",
  "bottom",
] as const

const DdrTrace = ({
  traceName,
  socSignal,
  memorySignal,
}: {
  readonly traceName: string
  readonly socSignal: string
  readonly memorySignal: string
}): React.JSX.Element => (
  <trace name={traceName} from={`U1.${socSignal}`} to={`U2.${memorySignal}`} />
)

/**
 * The canonical example circuit. Core produces both breakout groups and their
 * linked `pcb_breakout_point` records; the winding solver consumes that output.
 */
export const Am62lLpddr4Circuit = (): React.JSX.Element => (
  <board
    name="AM62L_LPDDR4_WINDING_EXAMPLE"
    width="45mm"
    height="25mm"
    layers={8}
    defaultTraceWidth="0.08128mm"
    minTraceWidth="0.08128mm"
    minTraceToPadEdgeClearance="0.05mm"
    minViaEdgeToPadEdgeClearance="0.08128mm"
    minViaHoleEdgeToViaHoleEdgeClearance="0.1016mm"
    minViaHoleDiameter="0.2032mm"
    minViaPadDiameter="0.4572mm"
    pcbStyle={{ viaHoleDiameter: "0.2032mm", viaPadDiameter: "0.4572mm" }}
    routingDisabled
  >
    <breakout
      name="SOC_BREAKOUT"
      pcbX={-10}
      pcbY={0}
      fanoutBoundaryPadding={{
        top: "5mm",
        right: "2mm",
        bottom: "5mm",
        left: "1mm",
      }}
      fanoutRoutingLayers={[...SIGNAL_LAYERS]}
      busFanoutDirections={{
        DDR_BYTE1: "top_right",
        DDR_ADDR_CTRL: "center_right",
        DDR_BYTE0: "bottom_right",
      }}
    >
      <AM62L32
        name="U1"
        footprintVariant="fccsp_373_anb"
        pcbX={0}
        pcbY={0}
        pcbRotation={180}
        noSchematicRepresentation
        noConnect={socNoConnect as never[]}
      />
    </breakout>

    <breakout
      name="RAM_BREAKOUT"
      pcbX={10.116917}
      pcbY={-0.050917}
      fanoutBoundaryPadding={{
        top: "5mm",
        right: "1mm",
        bottom: "5mm",
        left: "2mm",
      }}
      fanoutRoutingLayers={[...SIGNAL_LAYERS]}
      busFanoutDirections={{
        DDR_BYTE1: "top_left",
        DDR_ADDR_CTRL: "center_left",
        DDR_BYTE0: "bottom_left",
      }}
    >
      <MT53E1G16D1ZW
        name="U2"
        pcbX={0}
        pcbY={0}
        pcbRotation={90}
        noSchematicRepresentation
        noConnect={memoryNoConnect as never[]}
      />
    </breakout>

    <bus name="DDR_BYTE0" connections={getTraceNamesForBus("DDR_BYTE0")} />
    <bus name="DDR_BYTE1" connections={getTraceNamesForBus("DDR_BYTE1")} />
    <bus
      name="DDR_ADDR_CTRL"
      connections={getTraceNamesForBus("DDR_ADDR_CTRL")}
    />

    <differentialpair
      name="DQS0_PAIR"
      positiveConnection="DQS0"
      negativeConnection="DQS0_n"
    />
    <differentialpair
      name="DQS1_PAIR"
      positiveConnection="DQS1"
      negativeConnection="DQS1_n"
    />
    <differentialpair
      name="CK0_PAIR"
      positiveConnection="CK0"
      negativeConnection="CK0_n"
    />

    {DDR_CONNECTIONS.map(({ socSignal, memorySignal, traceName }) => (
      <DdrTrace
        key={traceName}
        traceName={traceName}
        socSignal={socSignal}
        memorySignal={memorySignal}
      />
    ))}
  </board>
)
