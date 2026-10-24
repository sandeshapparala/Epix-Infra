import type { TheaterDesign } from "../../components/theater-builder/design";
import type { Equipment, Product, Slot } from "./types";
export function visualDesign(
  design: TheaterDesign,
  equipment: Equipment,
  products: Product[],
): TheaterDesign {
  const projector = products.find(
    (p) => p.id === equipment.slots.projector?.productId,
  );
  const configured = {
    ...design,
    ...(projector?.specs.lumens ? { lumens: projector.specs.lumens } : {}),
    ...(projector?.specs.throwMin && projector.specs.throwMax
      ? {
          throwMin: projector.specs.throwMin,
          throwMax: projector.specs.throwMax,
        }
      : {}),
  };
  if (equipment.mode === "package") return configured;
  const channels: Partial<Record<Slot, string[]>> = {
    front: ["L", "R"],
    center: ["C"],
    surround: ["SL", "SR"],
    rear: ["SBL", "SBR"],
    subwoofer: ["SUB1", "SUB2"],
  };
  const equipmentSizes: Record<string, [number, number, number]> = {};
  for (const [slot, ids] of Object.entries(channels)) {
    const selected = equipment.slots[slot as keyof Equipment["slots"]];
    const p = products.find((p) => p.id === selected?.productId);
    if (p?.specs.dimensions)
      for (const id of ids) equipmentSizes[id] = p.specs.dimensions;
  }
  return { ...configured, equipmentSizes };
}
