import {
  NUMBER_LIMITS,
  calculateDesign,
  screenSize,
  type TheaterDesign,
} from "../../components/theater-builder/design";

type ProjectionInputs = Pick<
  TheaterDesign,
  "diagonal" | "aspect" | "throwMin" | "throwMax" | "width" | "height" | "depth"
>;

export function projectionPlan(d: ProjectionInputs, distance: number) {
  const image = screenSize(d.diagonal, d.aspect);
  const valid =
    [d.throwMin, d.throwMax, distance].every(Number.isFinite) &&
    d.throwMin > 0 &&
    d.throwMax >= d.throwMin &&
    distance > 0;
  const factor = screenSize(1, d.aspect).width;
  const screenLimit = Math.min(
    NUMBER_LIMITS.diagonal[1],
    (d.width - 0.2) / factor,
    (d.height - 0.85) / (factor / (d.aspect === "16:9" ? 16 / 9 : 2.4)),
  );
  return {
    valid,
    image,
    minDistance: image.width * d.throwMin,
    maxDistance: image.width * d.throwMax,
    trackMin: Math.max(0.22, image.width * d.throwMin),
    trackMax: Math.min(d.depth - 0.22, image.width * d.throwMax),
    minDiagonalAtDistance: valid
      ? Math.max(NUMBER_LIMITS.diagonal[0], distance / d.throwMax / factor)
      : 0,
    maxDiagonalAtDistance: valid
      ? Math.min(screenLimit, distance / d.throwMin / factor)
      : 0,
    currentRatio: distance / image.width,
    fixed: Math.abs(d.throwMax - d.throwMin) < 1e-8,
  };
}

// Preserve the existing zoom position when only screen geometry changes.
// A newly selected lens starts at its optical midpoint; fixed lenses are exact.
export function autoProjectorPlacement(
  next: TheaterDesign,
  previous?: TheaterDesign,
): TheaterDesign {
  if (next.display !== "projector") return next;
  const width = screenSize(next.diagonal, next.aspect).width;
  let ratio = (next.throwMin + next.throwMax) / 2;
  if (
    previous?.display === "projector" &&
    previous.throwMin === next.throwMin &&
    previous.throwMax === next.throwMax
  ) {
    const old = calculateDesign(previous);
    ratio = (old.projector[2] + previous.depth / 2) / old.screen.width;
  }
  ratio = Math.max(next.throwMin, Math.min(next.throwMax, ratio));
  const plan = projectionPlan(next, width * ratio);
  const distance =
    plan.trackMin <= plan.trackMax
      ? Math.max(plan.trackMin, Math.min(plan.trackMax, width * ratio))
      : Math.max(0.22, Math.min(next.depth - 0.22, width * ratio));
  return {
    ...next,
    positions: {
      ...next.positions,
      projector: [0, next.height - 0.42, distance],
    },
  };
}
