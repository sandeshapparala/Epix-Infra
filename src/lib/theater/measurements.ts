export type LengthUnit = "ft" | "m";

export const METRES_PER_FOOT = 0.3048;
export const METRES_PER_INCH = 0.0254;

// Keep geometry and saved designs in metres. Convert only at the UI boundary.
export function feetAndInches(metres: number) {
  const totalInches = Math.round(Math.abs(metres) / METRES_PER_INCH);
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}

export function formatLength(metres: number, unit: LengthUnit = "ft") {
  if (unit === "m") return `${metres.toFixed(2)} m`;
  const { feet, inches } = feetAndInches(metres);
  const sign = metres < 0 && (feet || inches) ? "−" : "";
  return `${sign}${feet} ft ${inches} in`;
}

export function lengthStep(unit: LengthUnit) {
  return unit === "ft" ? METRES_PER_INCH : 0.05;
}
