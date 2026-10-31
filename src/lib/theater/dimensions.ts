import {
  calculateDesign,
  SEATING_CLEARANCE,
  seatingPosition,
  type TheaterDesign,
} from "../../components/theater-builder/design";
import { formatLength } from "./measurements";

export type DimensionRow = { label: string; value: string };

// One feet-first schedule for the live quotation, exported image and saved PDF.
export function roomDimensions(design: TheaterDesign): DimensionRow[] {
  const calculated = calculateDesign(design);
  const rows: DimensionRow[] = [
    { label: "Room width", value: formatLength(design.width) },
    { label: "Room depth", value: formatLength(design.depth) },
    { label: "Ceiling height", value: formatLength(design.height) },
    { label: "Screen width", value: formatLength(calculated.screen.width) },
    { label: "Screen height", value: formatLength(calculated.screen.height) },
    {
      label: "Screen diagonal",
      value: `${formatLength(design.diagonal * 0.0254)} (${design.diagonal} in)`,
    },
    {
      label: "Front wall to primary seat",
      value: formatLength(calculated.viewingDistance),
    },
  ];
  for (let row = 1; row < design.rows; row++) {
    const gap =
      seatingPosition(design, row)[2] -
      seatingPosition(design, row - 1)[2] -
      SEATING_CLEARANCE.depth;
    rows.push({
      label: `Clear gap: rows ${row} to ${row + 1}`,
      value: formatLength(gap),
    });
  }
  rows.push({ label: "Aisle width", value: formatLength(design.aisleWidth) });
  if (design.rows > 1)
    rows.push({ label: "Riser per row", value: formatLength(design.riser) });
  if (design.display === "projector")
    rows.push({
      label: "Front wall to projector",
      value: formatLength(calculated.projector[2] + design.depth / 2),
    });
  return rows;
}
