import type { GraphicsObject } from "graphics-debug"
import { getLayerNames } from "../get-layer-names"
import { getLayerCandidatesByConnection } from "../input/get-bus-layer-candidates"
import { getCanonicalConnections } from "../input/get-canonical-connections"
import type { WindingBreakoutSolverInput } from "../types"
import { getConnectionColor } from "./get-connection-color"
import { getGraphicsLayer } from "./get-graphics-layer"

/** Draw region bounds and the canonical connection endpoints. */
export const createInputGraphics = (
  input: WindingBreakoutSolverInput,
  activeLayer?: string,
): GraphicsObject => {
  const graphics: Required<
    Pick<GraphicsObject, "circles" | "rects" | "texts">
  > = {
    circles: [],
    rects: [],
    texts: [],
  }
  const layerNames = getLayerNames(input)
  let displayedLayers = layerNames
  if (activeLayer) displayedLayers = [activeLayer]
  const visibleLayers = getGraphicsLayer(input, displayedLayers)
  const connections = getCanonicalConnections(input)
  const layerCandidatesByConnection = getLayerCandidatesByConnection(input)
  const endpointRadius = Math.min(0.12, input.boundaryPointSpacing / 4)

  for (const region of input.regions) {
    const center = {
      x: (region.bounds.minX + region.bounds.maxX) / 2,
      y: (region.bounds.minY + region.bounds.maxY) / 2,
    }
    graphics.rects.push({
      center,
      width: region.bounds.maxX - region.bounds.minX,
      height: region.bounds.maxY - region.bounds.minY,
      fill: "rgba(226, 232, 240, 0.035)",
      stroke: "rgba(71, 85, 105, 0.55)",
      layer: visibleLayers,
    })
    for (const connection of connections) {
      const layerCandidates = layerCandidatesByConnection[connection.id]!
      if (activeLayer && !layerCandidates.includes(activeLayer)) continue
      const endpoint = connection.endpoints.find(
        (candidate) => candidate.regionId === region.id,
      )
      if (!endpoint) continue
      const color = getConnectionColor(connection.id)
      graphics.circles.push({
        center: endpoint.position,
        radius: endpointRadius,
        fill: `${color}70`,
        stroke: color,
        layer: getGraphicsLayer(input, layerCandidates),
      })
    }
    graphics.texts.push({
      x: center.x,
      y: region.bounds.maxY + 0.35,
      text: region.id,
      anchorSide: "bottom_center",
      color: "#334155",
      fontSize: 0.34,
      layer: visibleLayers,
    })
  }
  return graphics
}
