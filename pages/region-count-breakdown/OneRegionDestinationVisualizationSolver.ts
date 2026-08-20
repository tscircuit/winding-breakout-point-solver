import type { GraphicsObject } from "graphics-debug"
import { oneRegionExternalDestinations } from "../../examples/region-count"
import type { GatePlacementResult } from "../../lib/gate-placement/place-breakout-gates"
import { getCanonicalConnections } from "../../lib/input/get-canonical-connections"
import { getLayerCandidatesByConnection } from "../../lib/input/get-bus-layer-candidates"
import { WindingBreakoutSolver } from "../../lib/WindingBreakoutSolver"
import type { WindingBreakoutSolverInput } from "../../lib/types"
import { getConnectionColor } from "../../lib/visualization/get-connection-color"
import { getGraphicsLayer } from "../../lib/visualization/get-graphics-layer"

/** Adds caller-owned, non-breakout destinations to the one-region demo only. */
export class OneRegionDestinationVisualizationSolver extends WindingBreakoutSolver {
  private activeDestinationLayer?: string

  override setVisualizationLayer(layer?: string): void {
    this.activeDestinationLayer = layer
    super.setVisualizationLayer(layer)
  }

  override visualize(): GraphicsObject {
    const base = super.visualize()
    const connections = getCanonicalConnections(this.inputProblem)
    const placement = this.getStageOutput<GatePlacementResult>("gatePlacement")
    const candidateLayers = getLayerCandidatesByConnection(this.inputProblem)
    const layerByConnection =
      placement?.layerByConnection ??
      Object.fromEntries(
        Object.entries(candidateLayers).map(([connectionId, layers]) => [
          connectionId,
          layers[0]!,
        ]),
      )
    const visibleDestinations = oneRegionExternalDestinations.filter(
      (destination) => {
        const connection = connections.find(
          (candidate) => candidate.id === destination.connectionId,
        )
        return (
          connection &&
          (!this.activeDestinationLayer ||
            layerByConnection[connection.id] === this.activeDestinationLayer)
        )
      },
    )

    const destinationPoints = visibleDestinations.map((destination) => {
      const connection = connections.find(
        (candidate) => candidate.id === destination.connectionId,
      )!
      return {
        ...destination.position,
        color: getConnectionColor(destination.connectionId),
        label: `${destination.connectionId} · external destination (not a breakout point)`,
        layer: getGraphicsLayer(this.inputProblem, [
          layerByConnection[connection.id]!,
        ]),
      }
    })
    let destinationLines: NonNullable<GraphicsObject["lines"]> = []
    if (placement) {
      destinationLines = visibleDestinations.flatMap((destination) => {
        const connection = connections.find(
          (candidate) => candidate.id === destination.connectionId,
        )!
        const breakout = placement.breakoutPoints.find(
          (point) => point.connectionId === destination.connectionId,
        )
        if (!breakout) return []
        return [
          {
            points: [breakout, destination.position],
            strokeColor: `${getConnectionColor(destination.connectionId)}88`,
            strokeWidth: 0.018,
            strokeDash: [0.06, 0.05],
            label: `${destination.connectionId} breakout continuation`,
            layer: getGraphicsLayer(this.inputProblem, [
              layerByConnection[connection.id]!,
            ]),
          },
        ]
      })
    }
    const destinationCircles = visibleDestinations.map((destination) => {
      const connection = connections.find(
        (candidate) => candidate.id === destination.connectionId,
      )!
      return {
        center: destination.position,
        radius: 0.09,
        fill: "#ffffff",
        stroke: getConnectionColor(destination.connectionId),
        label: `${destination.connectionId} external destination`,
        layer: getGraphicsLayer(this.inputProblem, [
          layerByConnection[connection.id]!,
        ]),
      }
    })
    const destinationTexts = visibleDestinations.map((destination) => {
      const connection = connections.find(
        (candidate) => candidate.id === destination.connectionId,
      )!
      return {
        x: destination.position.x + 0.08,
        y: destination.position.y,
        text: `→ ${destination.connectionId}`,
        anchorSide: "center_left" as const,
        color: getConnectionColor(destination.connectionId),
        fontSize: 0.18,
        layer: getGraphicsLayer(this.inputProblem, [
          layerByConnection[connection.id]!,
        ]),
      }
    })

    return {
      ...base,
      circles: [...(base.circles ?? []), ...destinationCircles],
      lines: [...(base.lines ?? []), ...destinationLines],
      points: [...(base.points ?? []), ...destinationPoints],
      texts: [...(base.texts ?? []), ...destinationTexts],
    }
  }
}
