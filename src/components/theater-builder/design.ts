export type CameraView = "orbit" | "plan" | "seat";
export type ObjectPosition = [number, number, number];
export type ObjectPositions = Record<string, ObjectPosition>;
// Z is stored as distance from the front wall so room resizing is predictable.
export function objectPosition(d: TheaterDesign, id: string, fallback: ObjectPosition): ObjectPosition {
  const p = d.positions?.[id];
  return p && (id.startsWith("row-") || id === "projector") ? [fallback[0], fallback[1], p[2] - d.depth / 2] : fallback;
}
export function seatingPosition(d: TheaterDesign, row: number): ObjectPosition {
  return objectPosition(d, `row-${row}`, [seatOffset(d), row * d.riser, -d.depth / 2 + d.distance + row * d.rowSpacing]);
}
export function constrainObjectMove(d: TheaterDesign, id: string, requested: ObjectPosition): ObjectPosition | null {
  if (id.startsWith("row-")) {
    const row = Number(id.slice(4));
    if (!Number.isInteger(row) || row < 0 || row >= d.rows) return null;
    return [seatOffset(d), row * d.riser, Math.max(0.7, Math.min(d.depth - 0.7, requested[2]))];
  }
  if (id === "projector") {
    const width = screenSize(d.diagonal, d.aspect).width;
    const min = Math.max(0.22, width * d.throwMin), max = Math.min(d.depth - 0.22, width * d.throwMax);
    const z = min <= max ? Math.max(min, Math.min(max, requested[2])) : Math.max(0.22, Math.min(d.depth - 0.22, requested[2]));
    return [0, d.height - 0.42, z];
  }
  return null;
}
export type TheaterDesign = {
  positions?: ObjectPositions;
  width: number; depth: number; height: number;
  seats: number; rows: number; distance: number; rowSpacing: number; riser: number;
  aisle: "both" | "left" | "right"; aisleWidth: number;
  display: "projector" | "tv"; diagonal: number; aspect: "16:9" | "2.4:1";
  audio: "5.1" | "5.1.2" | "7.2.4"; front: "tower" | "in-wall";
  finish: "graphite" | "walnut" | "midnight";
  lights: boolean; dimensions: boolean; coverage: boolean;
  lumens: number; gain: number; throwMin: number; throwMax: number;
};
export const DEFAULT_DESIGN: TheaterDesign = {
  width: 4.8, depth: 7, height: 2.8, seats: 3, rows: 2, distance: 3.5,
  rowSpacing: 1.7, riser: 0.25, aisle: "both", aisleWidth: 0.6,
  display: "projector", diagonal: 120, aspect: "16:9", audio: "7.2.4",
  front: "tower", finish: "graphite", lights: true, dimensions: false,
  coverage: false, lumens: 2500, gain: 1, throwMin: 1.35, throwMax: 2.84,
};
export const PRESETS: { name: string; description: string; values: Partial<TheaterDesign> }[] = [
  { name: "Intimate", description: "4 seats · 5.1.2", values: { width: 4, depth: 6.4, seats: 2, rows: 2, distance: 3.2, diagonal: 100, audio: "5.1.2" } },
  { name: "Cinema", description: "6 seats · 7.2.4", values: DEFAULT_DESIGN },
  { name: "Grand", description: "10 seats · 7.2.4", values: { width: 6.4, depth: 8, seats: 5, rows: 2, distance: 4, diagonal: 150, audio: "7.2.4" } },
];
export function screenSize(diagonal: number, aspect: TheaterDesign["aspect"]) {
  const ratio = aspect === "16:9" ? 16 / 9 : 2.4;
  const height = diagonal * 0.0254 / Math.sqrt(ratio * ratio + 1);
  return { width: height * ratio, height };
}
export function rowWidth(seats: number) { return seats * 0.78 + 0.16; }
export function seatOffset(d: TheaterDesign) {
  return d.aisle === "both" ? 0 : (d.aisle === "left" ? 1 : -1) * d.aisleWidth / 2;
}
export type SpeakerPlacement = {
  id: string; model: string; position: [number, number, number];
  size: [number, number, number]; yaw: number; distance: number;
  azimuth: number; elevation: number; delayMs: number; constrained: boolean;
};
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
/** Metres; screen is -Z, floor is Y=0. Angles are relative to the screen axis.
 * Nominal targets follow Dolby's home overhead placement diagrams. Boundary
 * clamping is reported, never represented as a physically perfect solution.
 */
export function solveSpeakers(d: TheaterDesign) {
  const primary = seatingPosition(d, 0);
  const listener: [number, number, number] = [primary[0], primary[1] + 1.15, primary[2]];
  const speakers: SpeakerPlacement[] = [];
  const frontZ = -d.depth / 2;
  function add(id: string, model: string, desired: [number, number, number], size: [number, number, number], fixedYaw?: number) {
    // Use a circumscribed horizontal footprint so a rotated cabinet stays inside.
    const margin = Math.hypot(size[0], size[2]) / 2 + 0.05;
    const position = objectPosition(d, id, [clamp(desired[0], -d.width / 2 + margin, d.width / 2 - margin), clamp(desired[1], 0, d.height - size[1]), clamp(desired[2], frontZ + margin, d.depth / 2 - margin)]);
    const dx = position[0] - listener[0], dy = position[1] + size[1] / 2 - listener[1], dz = position[2] - listener[2];
    const horizontal = Math.hypot(dx, dz);
    speakers.push({ id, model, position, size, yaw: fixedYaw ?? Math.atan2(-dx, -dz), distance: Math.hypot(horizontal, dy), azimuth: Math.atan2(dx, -dz) * 180 / Math.PI, elevation: Math.atan2(dy, horizontal) * 180 / Math.PI, delayMs: 0, constrained: position.some((value, i) => Math.abs(value - desired[i]) > 0.001) });
  }
  const frontDepth = d.front === "in-wall" ? 0.22 : 0.5;
  const frontSpread = Math.max(0.1, listener[2] - frontZ - frontDepth) * Math.tan(26 * Math.PI / 180);
  const screen = screenSize(d.diagonal, d.aspect);
  for (const side of [-1, 1]) {
    // Keep the front pair outside the visible screen, including offset seating.
    const x = side < 0 ? Math.min(listener[0] - frontSpread, -screen.width / 2 - 0.22) : Math.max(listener[0] + frontSpread, screen.width / 2 + 0.22);
    add(side < 0 ? "L" : "R", d.front === "in-wall" ? "inWall" : "tower", [x, d.front === "in-wall" ? 0.71 : 0, frontZ + frontDepth], [0.28, d.front === "in-wall" ? 0.88 : 1.12, d.front === "in-wall" ? 0.055 : 0.36], d.front === "in-wall" ? 0 : undefined);
  }
  add("C", "center", [0, 0.43, frontZ + 0.42], [0.62, 0.19, 0.28], 0);
  for (const side of [-1, 1]) {
    const x = side * (d.width / 2 - 0.24);
    const angle = (d.audio === "7.2.4" ? 100 : 110) * Math.PI / 180;
    const z = listener[2] - Math.abs(x - listener[0]) / Math.tan(angle);
    add(side < 0 ? "SL" : "SR", "bookshelf", [x, 0.96, z], [0.24, 0.38, 0.23]);
  }
  add("SUB1", "sub", [-d.width / 2 + 0.5, 0, frontZ + 0.68], [0.48, 0.48, 0.48], 0);
  if (d.audio === "7.2.4") {
    add("SUB2", "sub", [d.width / 2 - 0.5, 0, frontZ + 0.68], [0.48, 0.48, 0.48], 0);
    for (const side of [-1, 1]) {
      // Trace a 145-degree ray to the first room boundary.
      const dx = side * Math.sin(145 * Math.PI / 180), dz = -Math.cos(145 * Math.PI / 180);
      const t = Math.max(0.1, Math.min((d.depth / 2 - 0.25 - listener[2]) / dz, (side * (d.width / 2 - 0.25) - listener[0]) / dx));
      add(side < 0 ? "SBL" : "SBR", "bookshelf", [listener[0] + dx * t, 0.96, listener[2] + dz * t], [0.24, 0.38, 0.23]);
    }
  }
  if (d.audio !== "5.1") {
    const rise = d.height - 0.075 - listener[1];
    const xs = Math.min(rise * 0.65, d.width / 2 - 0.35);
    for (const forward of d.audio === "7.2.4" ? [-1, 1] : [0]) for (const side of [-1, 1]) {
      add(`${forward < 0 ? "TF" : forward > 0 ? "TR" : "TM"}${side < 0 ? "L" : "R"}`, "ceiling-grill", [listener[0] + side * xs, d.height - 0.1, listener[2] + forward * rise], [0.32, 0.055, 0.32], 0);
    }
  }
  const maxDistance = Math.max(...speakers.filter(s => s.model !== "sub").map(s => s.distance));
  for (const s of speakers) s.delayMs = s.model === "sub" ? 0 : Math.max(0, (maxDistance - s.distance) / 343 * 1000);
  const warnings: string[] = [];
  const constrained = speakers.filter(s => s.constrained);
  for (const s of speakers) {
    const radius = Math.hypot(s.size[0], s.size[2]) / 2;
    if (Math.abs(s.position[0]) + radius > d.width / 2 || Math.abs(s.position[2]) + radius > d.depth / 2 || s.position[1] < 0 || s.position[1] + s.size[1] > d.height) warnings.push(`${s.id} is outside the room. Move this speaker inside or restore automatic placement.`);
  }
  if (constrained.length) warnings.push(`Room boundaries limit ${constrained.map(s => s.id).join(", ")} speaker placement. Adjust the room or primary seat.`);
  const fronts = speakers.filter(s => s.id === "L" || s.id === "R");
  if (fronts.some(s => Math.abs(s.azimuth) < 22 || Math.abs(s.azimuth) > 30)) warnings.push("Front speaker angles fall outside the 22–30° target. Adjust seating distance, room width or screen size.");
  if (listener[2] >= d.depth / 2 - 0.8) warnings.push("Move the primary seat forward to leave space for surround sound behind you.");
  return { listener, speakers, warnings, maxDistance };
}
export function calculateDesign(d: TheaterDesign) {
  const screen = screenSize(d.diagonal, d.aspect);
  const primary = seatingPosition(d, 0);
  const viewingDistance = Math.max(0.01, primary[2] + d.depth / 2);
  const angle = 2 * Math.atan(screen.width / (2 * viewingDistance)) * 180 / Math.PI;
  const minThrow = screen.width * d.throwMin;
  const maxThrow = screen.width * d.throwMax;
  const projectedDistance = Math.min(Math.max(viewingDistance + 0.8, minThrow), Math.min(maxThrow, d.depth - 0.55));
  const nits = d.lumens * d.gain / (Math.PI * screen.width * screen.height);
  const aisleCount = d.aisle === "both" ? 2 : 1;
  const widthNeeded = rowWidth(d.seats) + aisleCount * d.aisleWidth;
  const rows = Array.from({ length: d.rows }, (_, row) => seatingPosition(d, row));
  const rearExtent = Math.max(...rows.map(p => p[2] + d.depth / 2 + 0.7));
  const warnings: string[] = [];
  const sound = solveSpeakers(d);
  for (const speaker of sound.speakers) {
    const radius = Math.hypot(speaker.size[0], speaker.size[2]) / 2;
    rows.forEach((p, row) => {
      if (Math.abs(speaker.position[0] - p[0]) < rowWidth(d.seats) / 2 + radius && Math.abs(speaker.position[2] - p[2]) < 0.7 + radius && speaker.position[1] < p[1] + 1.15 && speaker.position[1] + speaker.size[1] > p[1]) warnings.push(`${speaker.id} overlaps seating row ${row + 1}. Separate the speaker and seats.`);
    });
  }
  rows.forEach((p, row) => {
    if (Math.abs(p[0]) + rowWidth(d.seats) / 2 > d.width / 2 || Math.abs(p[2]) + 0.7 > d.depth / 2 || p[1] < 0 || p[1] + 1.15 > d.height) warnings.push(`Seating row ${row + 1} extends outside the room. Move it inside or enlarge the room.`);
    for (let other = row + 1; other < rows.length; other++) if (Math.abs(p[0] - rows[other][0]) < rowWidth(d.seats) && Math.abs(p[2] - rows[other][2]) < 1.4) warnings.push(`Seating rows ${row + 1} and ${other + 1} overlap. Increase their separation.`);
  });
  const projector = objectPosition(d, "projector", [0, d.height - 0.42, -d.depth / 2 + projectedDistance]);
  if (d.display === "projector") {
    const throwDistance = projector[2] + d.depth / 2;
    if (Math.abs(projector[0]) + 0.225 > d.width / 2 || Math.abs(projector[2]) + 0.22 > d.depth / 2 || projector[1] < 0 || projector[1] + 0.18 > d.height) warnings.push("The projector is outside the room. Move it inside.");
    if (throwDistance < minThrow || throwDistance > maxThrow) warnings.push("The projector is outside the throw range for this screen size. Move it or change the screen size.");
    if (Math.abs(projector[0]) > 0.05) warnings.push("The projector is off the screen centreline. Verify lens-shift capability or centre the projector.");
  }
  if (widthNeeded > d.width) warnings.push("The seats and aisles exceed the room width. Reduce seats, narrow the aisles, or widen the room.");
  if (rearExtent > d.depth - 0.3) warnings.push("The last row needs more rear clearance. Move the seating forward or increase room depth.");
  if (screen.width + 0.2 > d.width || screen.height + 0.85 > d.height) warnings.push("The screen exceeds the available wall area. Reduce the diagonal or increase room dimensions.");
  if (d.rows > 1 && d.rowSpacing < 1.5) warnings.push("Allow more space between rows for recliner movement. This demo assumes at least 1.5 m.");
  if (d.display === "projector" && (minThrow > d.depth - 0.55 || d.throwMax < d.throwMin)) warnings.push("The projector assumptions do not allow a valid placement in this room. Check the throw ratios or screen size.");
  if (d.rows > 1 && 1.15 + (d.rows - 1) * d.riser > d.height - 0.35) warnings.push("The raised seating is too close to the ceiling. Lower the risers or increase the ceiling height.");
  warnings.push(...sound.warnings);
  return { screen, angle, viewingDistance, minThrow, maxThrow, projectedDistance, projector, nits, widthNeeded, rearExtent, warnings, sound,
    totalSeats: d.seats * d.rows,
    speakerCount: d.audio === "7.2.4" ? 13 : d.audio === "5.1.2" ? 8 : 6,
  };
}
export const NUMBER_LIMITS = {
  width: [3, 8], depth: [4, 12], height: [2.2, 4], seats: [2, 5], rows: [1, 3],
  distance: [1.8, 7], rowSpacing: [1.2, 2.4], riser: [0.1, 0.45], aisleWidth: [0.4, 1.2],
  diagonal: [65, 180], lumens: [500, 6000], gain: [0.6, 1.5], throwMin: [0.5, 3], throwMax: [0.5, 4],
} as const;
export function parseSavedDesign(raw: string): TheaterDesign {
  const saved = JSON.parse(raw);
  if (saved?.version !== 1 || !saved.design || typeof saved.design !== "object") throw new Error("Unsupported design file.");
  const d = saved.design;
  for (const [key, [min, max]] of Object.entries(NUMBER_LIMITS)) {
    if (typeof d[key] !== "number" || !Number.isFinite(d[key]) || d[key] < min || d[key] > max) throw new Error("The saved design contains invalid dimensions.");
  }
  if (!Number.isInteger(d.seats) || !Number.isInteger(d.rows)) throw new Error("Invalid seating arrangement.");
  for (const [key, values] of Object.entries({ aisle: ["both", "left", "right"], display: ["projector", "tv"], aspect: ["16:9", "2.4:1"], audio: ["5.1", "5.1.2", "7.2.4"], front: ["tower", "in-wall"], finish: ["graphite", "walnut", "midnight"] })) {
    if (!values.includes(d[key])) throw new Error("The saved design contains an unsupported option.");
  }
  for (const key of ["lights", "dimensions", "coverage"]) if (typeof d[key] !== "boolean") throw new Error("Invalid viewer options.");
  // Whitelist fields so saved data cannot add arbitrary state.
  const clean = Object.fromEntries(Object.keys(DEFAULT_DESIGN).map(key => [key, d[key]])) as TheaterDesign;
  if (d.positions !== undefined) {
    if (!d.positions || typeof d.positions !== "object" || Array.isArray(d.positions)) throw new Error("Invalid object positions.");
    const allowed = /^(row-[0-2]|projector|L|R|C|SL|SR|SBL|SBR|SUB[12]|T[FRM][LR])$/;
    clean.positions = {};
    for (const [id, p] of Object.entries(d.positions)) {
      if (!allowed.test(id) || !Array.isArray(p) || p.length !== 3 || p.some(v => typeof v !== "number" || !Number.isFinite(v) || Math.abs(v) > 30)) throw new Error("Invalid object position.");
      if (id.startsWith("row-")) clean.positions[id] = [seatOffset(clean), Number(id.slice(4)) * clean.riser, p[2]];
      else if (id === "projector") clean.positions[id] = [0, clean.height - 0.42, p[2]];
    }
  }
  return clean;
}
