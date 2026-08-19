import { GenericSolverDebugger } from "@tscircuit/solver-utils/react"
import { useState } from "react"
import { WindingBreakoutSolver } from "../../lib/index"
import type { WindingBreakoutExample } from "../../lib/types"

export function WindingBreakoutSolverFixture({
  example,
}: {
  readonly example: WindingBreakoutExample
}): React.JSX.Element {
  const [activeLayer, setActiveLayer] = useState("")
  const [solver] = useState(() => new WindingBreakoutSolver(example))
  const signalLayers = example.stackup.filter(
    (entry) => entry.type === "signal",
  )
  return (
    <main style={{ minHeight: "100vh", background: "#fff" }}>
      <select
        aria-label="Layer"
        value={activeLayer}
        onChange={(event) => {
          const layer = event.currentTarget.value
          solver.setVisualizationLayer(layer || undefined)
          setActiveLayer(layer)
        }}
        style={{ margin: 8, padding: "6px 9px" }}
      >
        <option value="">All layers</option>
        {signalLayers.map((layer) => (
          <option key={layer.id} value={layer.id}>
            {layer.id}
          </option>
        ))}
      </select>
      <GenericSolverDebugger
        key={activeLayer || "all"}
        animationSpeed={100}
        solver={solver}
      />
    </main>
  )
}
