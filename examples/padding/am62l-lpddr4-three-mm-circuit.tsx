import { MT53E1G16D1ZW, ballMap } from "@tsci/0hmX.mt53e1g16d1zw-footprint"
import { AM62L32 } from "@tsci/tscircuit.ti"

const PADDING_CONNECTIONS = [
  {
    traceName: "DQ2",
    socSignal: "DDR0_DQ2",
    socPin: 91,
    memorySignal: "DQ2",
  },
  {
    traceName: "DQ3",
    socSignal: "DDR0_DQ3",
    socPin: 76,
    memorySignal: "DQ3",
  },
] as const

const usedSocPins = new Set<number>(
  PADDING_CONNECTIONS.map(({ socPin }) => socPin),
)
const socNoConnect = Array.from({ length: 373 }, (_, index) => index + 1)
  .filter((pin) => !usedSocPins.has(pin))
  .map((pin) => `pin${pin}`)

const usedMemorySignals = new Set<string>(
  PADDING_CONNECTIONS.map(({ memorySignal }) => memorySignal),
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

const PaddingTrace = ({
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

/** Core-rendered AM62L/LPDDR4 fixture with a real 3mm fanout boundary. */
export const Am62lLpddr4ThreeMillimeterPaddingCircuit =
  (): React.JSX.Element => (
    <board
      name="AM62L_LPDDR4_3MM_PADDING"
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
    >
      <breakout
        name="SOC_BREAKOUT"
        pcbX={-10}
        pcbY={0}
        fanoutBoundaryPadding="3mm"
        fanoutRoutingLayers={[...SIGNAL_LAYERS]}
        busFanoutDirections={{ DDR_PADDING: "center_right" }}
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
        fanoutBoundaryPadding="3mm"
        fanoutRoutingLayers={[...SIGNAL_LAYERS]}
        busFanoutDirections={{ DDR_PADDING: "center_left" }}
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

      <bus
        name="DDR_PADDING"
        connections={PADDING_CONNECTIONS.map(({ traceName }) => traceName)}
      />

      {PADDING_CONNECTIONS.map(({ traceName, socSignal, memorySignal }) => (
        <PaddingTrace
          key={traceName}
          traceName={traceName}
          socSignal={socSignal}
          memorySignal={memorySignal}
        />
      ))}
    </board>
  )
