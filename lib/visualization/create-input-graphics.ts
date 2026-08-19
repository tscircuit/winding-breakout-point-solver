import type { GraphicsObject } from "graphics-debug"
import type { WindingBreakoutSolverInput } from "../types"
import { getConnectionColor } from "./get-connection-color"
import { getGraphicsLayer } from "./get-graphics-layer"

/** Draw immutable component, breakout-band, and source-pad input geometry. */
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
  const allSignalLayers = input.stackup
    .filter((entry) => entry.type === "signal")
    .map((entry) => entry.id)
  const allLayers = getGraphicsLayer(
    input,
    activeLayer ? [activeLayer] : allSignalLayers,
  )
  const padLayer = getGraphicsLayer(input, [input.padLayer])

  for (const region of input.regions) {
    const componentMinX = region.center.x - region.component.width / 2
    const componentMaxX = region.center.x + region.component.width / 2
    const componentMinY = region.center.y - region.component.height / 2
    const componentMaxY = region.center.y + region.component.height / 2

    graphics.rects.push({
      center: region.center,
      width: region.component.width,
      height: region.component.height,
      fill: "rgba(148, 163, 184, 0.12)",
      stroke: "#64748b",
      layer: allLayers,
    })
    graphics.rects.push({
      center: {
        x: (region.bounds.minX + region.bounds.maxX) / 2,
        y: (region.bounds.minY + region.bounds.maxY) / 2,
      },
      width: region.bounds.maxX - region.bounds.minX,
      height: region.bounds.maxY - region.bounds.minY,
      fill: "rgba(226, 232, 240, 0.035)",
      stroke: "rgba(71, 85, 105, 0.55)",
      layer: allLayers,
    })

    for (const [busId, band] of Object.entries(input.busBands ?? {})) {
      const isVerticalEdge = region.edge === "left" || region.edge === "right"
      const minX =
        region.edge === "right"
          ? componentMaxX
          : region.edge === "left"
            ? region.bounds.minX
            : band.min
      const maxX =
        region.edge === "right"
          ? region.bounds.maxX
          : region.edge === "left"
            ? componentMinX
            : band.max
      const minY =
        region.edge === "top"
          ? componentMaxY
          : region.edge === "bottom"
            ? region.bounds.minY
            : band.min
      const maxY =
        region.edge === "top"
          ? region.bounds.maxY
          : region.edge === "bottom"
            ? componentMinY
            : band.max
      graphics.rects.push({
        center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
        width: maxX - minX,
        height: maxY - minY,
        fill: "rgba(14, 165, 233, 0.06)",
        stroke: "rgba(14, 116, 144, 0.34)",
        layer: allLayers,
        label: isVerticalEdge ? `${busId} band` : undefined,
      })
    }

    for (const port of
      !activeLayer || activeLayer === input.padLayer ? region.ports : []) {
      const color = getConnectionColor(port.connectionId)
      graphics.circles.push({
        center: port.position,
        radius: region.padGrid.padRadius,
        fill: `${color}70`,
        stroke: color,
        layer: padLayer,
      })
    }

    graphics.texts.push({
      x: region.center.x,
      y: componentMaxY + 0.35,
      text: region.label ?? region.id,
      anchorSide: "bottom_center",
      color: "#334155",
      fontSize: 0.34,
      layer: allLayers,
    })
  }
  return graphics
}
