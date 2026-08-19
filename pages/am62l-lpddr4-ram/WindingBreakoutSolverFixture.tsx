import { GenericSolverDebugger } from "@tscircuit/solver-utils/react"
import { useEffect, useMemo, useState } from "react"
import { WindingBreakoutSolver } from "../../lib/index"
import type { WindingBreakoutExample } from "../../lib/types"

export function WindingBreakoutSolverFixture({
  loadExample,
}: {
  readonly loadExample: () => Promise<WindingBreakoutExample>
}): React.JSX.Element {
  const [example, setExample] = useState<WindingBreakoutExample>()
  const [error, setError] = useState<unknown>()

  useEffect(() => {
    let active = true
    loadExample().then(
      (loadedExample) => {
        if (active) setExample(loadedExample)
      },
      (loadError: unknown) => {
        if (active) setError(loadError)
      },
    )
    return () => {
      active = false
    }
  }, [loadExample])

  if (error) {
    return <pre>Could not render the tscircuit example: {String(error)}</pre>
  }
  if (!example) return <main style={{ padding: 16 }}>Rendering circuit…</main>

  return <LoadedWindingBreakoutSolverFixture example={example} />
}

function LoadedWindingBreakoutSolverFixture({
  example,
}: {
  readonly example: WindingBreakoutExample
}): React.JSX.Element {
  const [activeLayer, setActiveLayer] = useState("")
  const solver = useMemo(() => new WindingBreakoutSolver(example), [example])
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
